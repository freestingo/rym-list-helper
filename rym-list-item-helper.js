// ==UserScript==
// @name        Nicolo's RYM List Helper
// @description adds features to the listmaking pages of rateyourmusic
// @version     1.0
// @include     https://rateyourmusic.com/lists/new_item*
// @grant       metadata
// @require     https://unpkg.com/rxjs@7.8.1/dist/bundles/rxjs.umd.min.js
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js
// @require     https://raw.githubusercontent.com/timdown/rangyinputs/master/rangyinputs-jquery.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/ramda/0.25.0/ramda.min.js
// ==/UserScript==

const { merge, fromEvent, startWith, groupBy, map, mergeMap, filter, iif, tap, of } = rxjs;
const { pipe, head } = R;
const log = message => console.log(`Nicolo's RYM List Helper: ${message}`);

const LEFT = 'left';
const MIDDLE = 'middle';
const RIGHT = 'right';
const formatButtonStyles = {
  bold: 'font-style: bold',
  italic: 'font-style: italic',
  underline: 'text-decoration: underline',
  strikethrough: 'text-decoration: line-through',
  mono: 'font-family: monospace',
  color: '', // TODO: add background color or something
  blockquote: 'margin-left: 10px',
  quote: '',
  note: '',
  link: '',
};
const colorDropdownOptions = [
    ['tomato', 'red']
  , ['orange', 'orange']
  , ['springgreen', 'green']
];

const createFormatButton = (label, markupTag, flexSide) => {
  const button = document.createElement('div');
  button.innerText = label;
  button.className = `btn ${markupTag === 'link' || markupTag === 'preview' ? 'blue_btn' : ''} btn_small`;
  button.style = formatButtonStyles[label];
  button.dataset.markupTag = markupTag;
  button.dataset.flexSide = flexSide;
  button.setAttribute('id', `${label.toLowerCase()}-button`);
  return button;
};
const createButtonContainer = () => {
  const container = document.createElement('div');
  container.style = 'display: flex; justify-content: space-between;';
  container.setAttribute('id', `button-container`);
  return container;
};
const createButtonSubContainer = (flexSide) => {
  const container = document.createElement('div');
  container.style = 'display: flex; margin: 10px 0px; gap: 3px;';
  container.dataset.flexSide = flexSide;
  return container;
};
const createDropdownOption = ([value, label]) => {
  const option = document.createElement('option');
  option.innerText = label;
  option.setAttribute('value', value);
  return option;
};

const descriptionTextarea = document.getElementById('item_description');
const saveChangesButton = document.getElementById('list_new_item_btn');
const buttonContainer = createButtonContainer();
const buttonSubContainers = [createButtonSubContainer(LEFT), createButtonSubContainer(RIGHT)];
const formatButtons = [
    createFormatButton('link', 'link', LEFT)
  , createFormatButton('bold', 'b', LEFT)
  , createFormatButton('italic', 'i', LEFT)
  , createFormatButton('underline', 'u', LEFT)
  , createFormatButton('strikethrough', 's', LEFT)
  , createFormatButton('mono', 'tt', LEFT)
  , createFormatButton('color', 'color', LEFT)
  , createFormatButton('blockquote', 'blockquote', RIGHT)
  , createFormatButton('quote', 'quote', RIGHT)
  , createFormatButton('note', 'note', RIGHT)
  , createFormatButton('preview', 'preview', RIGHT)
];
const previewButton = formatButtons.find(button => button.dataset.markupTag === 'preview');
const colorButton = formatButtons.find(button => button.dataset.markupTag === 'color');

// make save-changes-button prettier and align it with textarea
saveChangesButton.style.width = '100%';
descriptionTextarea.style.width = '100%';

// add preview area (initially hidden) below save-changes button
const previewContainer = document.createElement('div');
previewContainer.style = 'flex-direction: column; gap: 5px; font-weight: normal; display: none';
previewContainer.setAttribute('id', 'preview-container');
const previewBox = document.createElement('div');
previewBox.style = 'padding: 15px; border: #8795a3 1px solid; border-radius: 4px; width: 100%';
previewBox.setAttribute('id', 'item_description_preview');
descriptionTextarea.after(previewContainer); // after textarea, inside bold label
previewContainer.appendChild(previewBox);

// add format buttons above textarea
descriptionTextarea.before(buttonContainer);
buttonSubContainers.forEach(subContainer => buttonContainer.appendChild(subContainer));
formatButtons.forEach(button => buttonSubContainers
  .find(subContainer => subContainer.dataset.flexSide === button.dataset.flexSide)
  .appendChild(button));

// create color dropdown
const colorDropdown = document.createElement('select');
colorDropdownOptions
  .map(createDropdownOption)
  .forEach(option => colorDropdown.appendChild(option));
// place color dropdown just right to the color button
colorButton.after(colorDropdown);

const getMarkupTags = markupTag => markupTag === 'link'
  ? [`[${prompt('please paste your link here')},`, `]`]
  : markupTag === 'color'
  ? [`[${markupTag} ${colorDropdown.value}]`, `[/${markupTag}]`]
  : [`[${markupTag}]`, `[/${markupTag}]`];

// update color button background when selecting a new color from the dropdown
fromEvent(colorDropdown, 'change')
  .pipe(
    map(event => event.target.value),
    startWith(pipe(head, head)(colorDropdownOptions)),
  )
  .subscribe(selectedColor => colorButton.style.backgroundColor = selectedColor);

// configure events for buttons that add formatting
merge(...formatButtons.map(button => fromEvent(button, 'click')))
  .pipe(
    filter(({ target }) => target.dataset.markupTag !== 'preview'),
    map(({ target }) => getMarkupTags(target.dataset.markupTag)),
  )
  .subscribe(([startTag, endTag]) => {
    $(descriptionTextarea).surroundSelectedText(startTag, endTag);
  });

// show preview area when clicking the preview button
// giovanni
fromEvent(previewButton, 'click')
  .pipe(map(() => previewContainer.style.display === 'none' ? ['flex', 'none', 'edit'] : ['none', '', 'preview']))
  .subscribe(([previewContainerDisplay, descriptionTextareaDisplay, previewButtonLabel]) => {
    previewContainer.style.display = previewContainerDisplay;
    descriptionTextarea.style.display = descriptionTextareaDisplay;
    previewButton.innerText = previewButtonLabel;
    unsafeWindow.previewO('item_description');
  });

