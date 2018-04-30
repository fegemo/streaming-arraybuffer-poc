import request from './request.js';

const formEl = document.querySelector('form');
const fileEl = formEl.querySelector('#file');
const progressEl = formEl.querySelector('#progress');


formEl.addEventListener('submit', (e) => {
  e.preventDefault();
  request(fileEl.value, reportProgress);
})


function reportProgress (percentageConcluded) {
  const percentage = 100 * percentageConcluded;
  progressEl.innerHTML = `${percentage.toFixed(0)}%`;
}
