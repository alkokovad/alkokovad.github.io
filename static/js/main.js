let home = document.getElementById('home')
let projects = document.getElementById('projects')
let contact = document.getElementById('contact')


const showMenu = (toggleId) =>{
  const toggle = document.getElementById(toggleId);
  if(toggle){
    toggle.addEventListener('click', ()=>{
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