let home = document.getElementById('home_nav')
let projects = document.getElementById('projects_nav')
let contact = document.getElementById('contact_nav')
const navLink = document.querySelectorAll('.nav__link');


const showMenu = (toggleId) =>{
  const toggle = document.getElementById(toggleId);
  if(toggle){
    toggle.addEventListener('click', ()=>{
       navLink.forEach(n => n.classList.remove('active'));
       home.classList.toggle('hidden');
       home.classList.toggle('home_show');
       projects.classList.toggle('hidden');
       projects.classList.toggle('projects_show');
       contact.classList.toggle('hidden');
       contact.classList.toggle('contact_show');
    })
  }
}
showMenu('nav-toggle')

function hideMenu(){
       navLink.forEach(n => n.classList.remove('active'));
       home.classList.toggle('hidden');
       home.classList.toggle('home_show');
       projects.classList.toggle('hidden');
       projects.classList.toggle('projects_show');
       contact.classList.toggle('hidden');
       contact.classList.toggle('contact_show');
}

function linkAction(){
  navLink.forEach(n => n.classList.remove('active'));
  this.classList.add('active');
  hideMenu()
}
navLink.forEach(n => n.addEventListener('click', linkAction));