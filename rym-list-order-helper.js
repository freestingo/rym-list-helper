// ==UserScript==
// @name        Nicolo's RYM List Order Helper
// @description makes the list items draggable and reorderable without leaving the main edit page
// @version     1.0
// @include     https://rateyourmusic.com/lists/edit*
// @grant       metadata
// @grant       GM.xmlHttpRequest
// @require     https://unpkg.com/rxjs@7.8.1/dist/bundles/rxjs.umd.min.js
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js
// @require     https://raw.githubusercontent.com/timdown/rangyinputs/master/rangyinputs-jquery.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/ramda/0.25.0/ramda.min.js
// @require     https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js
// ==/UserScript==

const { fromEvent } = rxjs;
const { last } = R;
const getListItems = () => [...document.querySelectorAll(`tr`)]
  .filter(({ id, style }) => id.includes('list_item') && style.display !== 'none');

const reorderListLink = document.querySelector(`.btn.blue_btn.btn_small[href*='lists/reorder_list']`);
const [_, listId] = reorderListLink.href.split('=');
reorderListLink.remove();
const reorderListButton = document.createElement('div');
reorderListButton.className = 'btn blue_btn btn_small';
reorderListButton.innerText = 'Save New List Order';
reorderListButton.setAttribute('id', 'reorder-list-button');
const editListLink = document.querySelector(`.btn.blue_btn.btn_small[href*='lists/ac']`);
editListLink.after(reorderListButton);

const listTable = document.querySelector('#list_content>tbody');
const listInserters = document.querySelectorAll('.list_inserter');
listInserters.forEach(listInserter => listInserter.remove());
// TODO: add-before/after buttons should be more intuitive
// getListItems()
//   .forEach(listItem => {
//     const listItemIndex = parseInt(last(listItem.id.split('_')));
//     const deleteItemButton = listItem.querySelector('.darkred_btn');
//     const addItemBelowButton = document.createElement('a');
//     addItemBelowButton.className = 'btn btn_small';
//     addItemBelowButton.innerText = '↓';
//     addItemBelowButton.href = `javascript:newItem('${listItemIndex + 1}');`;
//     const addItemAboveButton = document.createElement('a');
//     addItemAboveButton.className = 'btn btn_small';
//     addItemAboveButton.innerText = '↑';
//     addItemAboveButton.href = `javascript:newItem('${listItemIndex}');`;
//     deleteItemButton.after(addItemBelowButton);
//     deleteItemButton.after(addItemAboveButton);
//   });

Sortable.create(listTable, {
  filter: 'tr:first-child',
  onEnd: (event) => {
    console.log('element dragged!', event);
  },
});

fromEvent(reorderListButton, 'click')
  .subscribe(() => {
    const currentOrder = getListItems()
      .map(listItem => `item${listItem.querySelector('td>span').innerText}`)
      .join('|');

    GM.xmlHttpRequest({
      method: "post",
      url: "/lists/reorder_list_2",
      headers: { "Content-type" : "application/x-www-form-urlencoded" },
      data: encodeURI(`list_id=${listId}&orderl=${currentOrder}`),
      onload: (event) => {
        window.location = event.finalUrl; // refresh the page with the updated list order
      },
    });
  });

