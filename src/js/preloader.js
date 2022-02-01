// Do not use jQuery for this file's contents.
// Using vanilla JS will provide the quickest execution time for preloader purposes in the event of slow connections.

const content = document.querySelector('#content');
const preloaderContent = document.querySelector('#preloader');
const preloaderMessage = document.querySelector('#preload-message');
const preloaderExtended = document.querySelector('#preload-extended-container');

const preloader = {
  loaded: false,
  contentLoading() {
    this.loaded = false;
    content.style.display = 'none';
    preloaderContent.style.display = '';
    setTimeout(() => {
      if (!this.loaded) preloaderExtended.classList.remove('loaded');
    }, 25000)
  },
  contentLoaded() {
    this.loaded = true;
    preloaderContent.classList.add('contentLoaded');
    setTimeout(() => {
      content.style.display = '';
      preloaderContent.style.display = 'none';
    }, 300)
  },
  setMessage(message) {
    preloaderMessage.textContent = message;
  }
}

preloader.contentLoading();