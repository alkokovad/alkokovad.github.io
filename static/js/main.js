let home = document.querySelector('home')
let projects = document.querySelector('projects')
let contact = document.querySelector('contact')


const showMenu = (toggleId, navId) =>{
  const toggle = document.getElementById(toggleId);
  nav = document.getElementById(navId);
  if(toggle && nav){
    toggle.addEventListener('click', ()=>{
       home.classList.toggle('home_show')
       projects.classList.toggle('projects_show')
       contact.classList.toggle('show_contact')
    })
  }
}
showMenu('nav-toggle', 'nav-menu')