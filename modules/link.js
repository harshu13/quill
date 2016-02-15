import extend from 'extend';
import Inline from '../blots/inline';
import Tooltip from '../ui/tooltip';


class LinkTooltip extends Tooltip {
  constructor(quill, options = {}) {
    options = extend({}, LinkTooltip.DEFAULTS, options);
    super(quill, options);
    this.container.classList.add('ql-link-tooltip');
    this.textbox = this.container.querySelector('.input');
    this.link = this.container.querySelector('.url');
    this.initListeners();
    quill.keyboard.addBinding({ key: 'K', metaKey: true}, this._onKeyboard.bind(this));
  }

  initListeners() {
    this.quill.on(Quill.events.SELECTION_CHANGE, (range) => {
      if (range == null || range.length > 0) return;
      let anchor = this._findAnchor(range);
      if (anchor != null) {
        this.setMode(anchor.href, false);
        this.show(anchor);
      } else if (this.container.style.left != Tooltip.HIDE_MARGIN) {
        this.hide();
      }
    });
    this.container.querySelector('.done').addEventListener('click', this.saveLink.bind(this));
    this.container.querySelector('.remove').addEventListener('click', () => {
      this.removeLink(this.quill.getSelection());
    });
    this.container.querySelector('.change').addEventListener('click', () => {
      this.setMode(this.link.href, true);
    });
    this.initTextbox(this.textbox, this.saveLink, this.hide);
    this.quill.onModuleLoad('toolbar', (toolbar) => {
      this.toolbar = toolbar;
      toolbar.initFormat('link', this._onToolbar.bind(this));
    });
  }

  removeLink(range) {
    // Expand range to the entire leaf
    if (range.length === 0) {
      range = this._expandRange(range);
    }
    this.hide();
    this.quill.formatText(range, 'link', false, Quill.sources.USER);
    if (this.toolbar != null) {
      this.toolbar.setActive('link', false);
    }
  }

  saveLink() {
    let url = this._normalizeURL(this.textbox.value);
    let range = this.quill.getSelection(true);
    if (range != null) {
      if (range.length > 0) {
        let anchor = this._findAnchor(range);
        if (anchor != null) {
          anchor.href = url;
        }
      } else {
        this.quill.formatText(range, 'link', url, Quill.sources.USER);
      }
      this.quill.setSelection(range.end, range.end);
    }
    this.setMode(url, false);
  }

  setMode(url, edit = false) {
    if (edit) {
      this.textbox.value = url;
      setTimeout(() => {
        // Setting value and immediately focusing doesn't work on Chrome
        this.textbox.focus();
        this.textbox.setSelectionRange(0, url.length);
      }, 0);
    } else {
      this.link.href = url;
      url = this.link.href;
      this.link.textContent = url.length > this.options.maxLength ? url.slice(0, this.options.maxLength) + '...' : url;
    }
    this.container.classList.toggle('editing', edit);
  }

  _expandRange(range) {
    let [leaf, offset] = this.quill.editor.doc.findLeafAt(range.index, true);
    let index = range.index - offset;
    let length = leaf.length;
    return { index: index, length: length };
  }

  _findAnchor(range) {
    let node;
    let [leaf, offset] = this.quill.editor.doc.findLeafAt(range.index, true);
    if (leaf != null) {
      node = leaf.node;
    }
    while (node != null && node !== this.quill.root) {
      if (node.tagName === 'A') return node;
      node = node.parentNode;
    }
    return null;
  }

  _normalizeURL(url) {
    if (!/^(https?:\/\/|mailto:)/.test(url)) {
      url = 'http://' + url;
    }
    return url;
  };

  _onKeyboard() {
    let range = this.quill.getSelection();
    this._toggle(range, !this._findAnchor(range));
  }

  _onToolbar(range, value) {
    this._toggle(range, value);
  }

  _toggle(range, value) {
    if (range == null) return;
    if (!value) {
      this.removeLink(range);
    } else if (range.length > 0) {
      this.setMode(this._suggestURL(range), true);
      let nativeRange = this.quill.editor.selection._getNativeRange();
      this.show(nativeRange);
    }
  }

  _suggestURL(range) {
    let text = this.quill.getText(range);
    return this._normalizeURL(text);
  };
}
LinkTooltip.DEFAULTS = {
  maxLength: 50,
  template: `
    <span class="title">Visit URL:&nbsp;</span>
    <a href="#" class="url" target="_blank" href="about:blank"></a>
    <input class="input" type="text">
    <span>&nbsp;&#45;&nbsp;</span>
    <a href="javascript:;" class="change">Change</a>
    <a href="javascript:;" class="remove">Remove</a>
    <a href="javascript:;" class="done">Done</a>`
};
LinkTooltip.hotkeys = {
  LINK: {
    key: 'K',
    metaKey: true
  }
};


export { LinkTooltip as default };
