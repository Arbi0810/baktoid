document.addEventListener('DOMContentLoaded', function(evt) {
  'use strict';

  var activeImage = document.getElementsByClassName('active-image_gallery-image')[0],
      mediaGallery = document.getElementsByClassName('mediaGallery__container')[0];

  if (mediaGallery) {
    mediaGallery.addEventListener('click', function(evt) {
      if (evt.target.className.indexOf('mediaGallery__img') > -1) {
        evt.stopPropagation();
        evt.preventDefault();
        activeImage.setAttribute('src', evt.target.getAttribute('data-src'));
      }
    });
  }
});