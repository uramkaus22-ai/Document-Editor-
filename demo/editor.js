// demo/editor.js
// Basic paged editor flow implementation.
//
// Usage: keep pages as .page > .page-content[contenteditable].
// This script automatically appends pages when a page's content overflows
// and moves overflowing block nodes into the next page. It will split very
// large paragraphs if needed.

(function () {
  const book = document.getElementById('book');

  function createPage() {
    const page = document.createElement('div');
    page.className = 'page';
    const content = document.createElement('div');
    content.className = 'page-content';
    content.contentEditable = 'true';
    content.dataset.page = (book.children.length + 1);
    content.innerHTML = '<p><br></p>';
    page.appendChild(content);

    // wire up handlers:
    content.addEventListener('input', () => flowCheckFrom(content));
    content.addEventListener('keydown', (e) => {
      // on Enter, wait for input to fire and then check.
      // We still call flowCheckFrom after a short delay for IME/complex inputs.
      setTimeout(() => flowCheckFrom(content), 0);
    });
    content.addEventListener('paste', () => setTimeout(() => flowCheckFrom(content), 0));
    return page;
  }

  function getLastPageContent() {
    const lastPage = book.lastElementChild;
    return lastPage.querySelector('.page-content');
  }

  // Append initial handlers for the first page
  document.querySelectorAll('.page-content').forEach(pc => {
    pc.addEventListener('input', () => flowCheckFrom(pc));
    pc.addEventListener('keydown', () => setTimeout(() => flowCheckFrom(pc), 0));
    pc.addEventListener('paste', () => setTimeout(() => flowCheckFrom(pc), 0));
  });

  // Main flow-check entrypoint starting from a given page content.
  function flowCheckFrom(pageContent) {
    // If any page beyond this overflows due to earlier moves, we should scan forward.
    let current = pageContent;
    while (current) {
      // ensure there's a next page to receive overflow
      if (!current.parentElement.nextElementSibling) {
        book.appendChild(createPage());
      }
      const nextContent = current.parentElement.nextElementSibling.querySelector('.page-content');
      // move overflow from current into nextContent
      moveOverflow(current, nextContent);
      current = nextContent;
      // stop if next not overflowing
      if (!isOverflowing(current)) break;
    }
  }

  // Check if the content DIV is overflowing its visible area.
  function isOverflowing(contentEl) {
    return contentEl.scrollHeight > contentEl.clientHeight + 1; // small tolerance
  }

  // Move overflow nodes from 'fromContent' into the start of 'toContent' until 'fromContent' fits.
  // If a single block is too big, split it (binary search on character length).
  function moveOverflow(fromContent, toContent) {
    if (!isOverflowing(fromContent)) return;

    // We will work with block-level children (paragraphs, headings, lists).
    ensureAtLeastOneParagraph(fromContent);
    ensureAtLeastOneParagraph(toContent);

    // While still overflowing, repeatedly move last block to beginning of next page.
    while (isOverflowing(fromContent)) {
      const blocks = Array.from(fromContent.children);
      if (blocks.length === 0) break;
      const last = blocks[blocks.length - 1];

      // If moving the whole node would make 'from' fit, move it.
      // Try moving it temporarily into next and measure.
      const moved = last.cloneNode(true);
      toContent.insertBefore(moved, toContent.firstChild);
      last.remove();

      if (!isOverflowing(fromContent)) {
        // moved entirely fits; continue
      } else {
        // Removing the whole block didn't fix overflow => that single block is too large.
        // Need to split it: restore and split.
        toContent.removeChild(toContent.firstChild);
        fromContent.appendChild(last); // put it back
        splitBlockBetweenPages(last, fromContent, toContent);
      }

      // Ensure next page exists for additional overflow
      if (!toContent.parentElement.nextElementSibling) {
        book.appendChild(createPage());
      }
    }

    ensureAtLeastOneParagraph(fromContent);
    ensureAtLeastOneParagraph(toContent);

    // If user was focused in fromContent, move caret into start of toContent
    if (document.activeElement === fromContent || document.activeElement === fromContent.parentElement) {
      placeCaretAtStart(toContent);
    }
  }

  function ensureAtLeastOneParagraph(contentEl) {
    if (contentEl.children.length === 0) {
      const p = document.createElement('p');
      p.innerHTML = '<br>';
      contentEl.appendChild(p);
    }
  }

  function placeCaretAtStart(container) {
    container.focus();
    const sel = document.getSelection();
    sel.removeAllRanges();
    const r = document.createRange();
    let node = container;
    while (node && node.firstChild) node = node.firstChild;
    if (!node) node = container;
    r.setStart(node, 0);
    r.collapse(true);
    sel.addRange(r);
  }

  function splitBlockBetweenPages(block, fromContent, toContent) {
    const text = block.innerText || '';
    if (text.length === 0) {
      toContent.insertBefore(block, toContent.firstChild);
      return;
    }

    let lo = 0, hi = text.length;
    let best = 0;
    fromContent.removeChild(block);

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const prefix = text.slice(0, mid);
      const suffix = text.slice(mid);

      const testPrefixEl = document.createElement('p');
      testPrefixEl.innerText = prefix || '\u200B';
      const testSuffixEl = document.createElement('p');
      testSuffixEl.innerText = suffix || '\u200B';

      fromContent.appendChild(testPrefixEl);
      toContent.insertBefore(testSuffixEl, toContent.firstChild);

      const fits = !isOverflowing(fromContent);

      fromContent.removeChild(testPrefixEl);
      toContent.removeChild(testSuffixEl);

      if (fits) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    const finalPrefix = document.createElement('p');
    finalPrefix.innerText = text.slice(0, best) || '\u200B';
    const finalSuffix = document.createElement('p');
    finalSuffix.innerText = text.slice(best) || '\u200B';

    fromContent.appendChild(finalPrefix);
    toContent.insertBefore(finalSuffix, toContent.firstChild);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const first = getLastPageContent();
    flowCheckFrom(first);
  });

  window.pagedEditor = {
    createPage,
    flowCheckFrom,
    isOverflowing,
  };

})();
