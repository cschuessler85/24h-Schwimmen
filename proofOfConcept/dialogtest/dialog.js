const dialogElement = document.querySelector("dialog");
const openModalButton = document.querySelector("#open_modal");

openModalButton.onclick = () => dialogElement.showModal();

window.addEventListener("click", event => {
  if (event.target === dialogElement) dialogElement.close();
});