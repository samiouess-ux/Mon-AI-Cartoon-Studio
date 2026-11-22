const STORAGE_KEY = "mon-ai-cartoon-studio-v1";
const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"characters":[],"projects":[]}');
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function renderList(targetId, items, type){
  const target=document.getElementById(targetId);
  if(!items.length){target.innerHTML='<p class="muted">Rien pour le moment. Ajoutez votre premier élément.</p>';return;}
  target.innerHTML=items.map((item,index)=>'<div class="saved-item"><div><strong>'+escapeHtml(item.name)+'</strong><small>'+escapeHtml(item.note||"")+'</small></div><button class="delete" data-type="'+type+'" data-index="'+index+'">Supprimer</button></div>').join("");
}
function render(){renderList("characters-list",state.characters,"characters");renderList("projects-list",state.projects,"projects");}
document.getElementById("character-form").addEventListener("submit",event=>{event.preventDefault();const name=document.getElementById("character-name").value.trim();const note=document.getElementById("character-note").value.trim();if(!name)return;state.characters.push({name,note});save();event.target.reset();render();});
document.getElementById("project-form").addEventListener("submit",event=>{event.preventDefault();const name=document.getElementById("project-name").value.trim();const note=document.getElementById("project-note").value.trim();if(!name)return;state.projects.push({name,note});save();event.target.reset();render();});
document.addEventListener("click",event=>{const button=event.target.closest("[data-type]");if(!button)return;const type=button.dataset.type;const index=Number(button.dataset.index);state[type].splice(index,1);save();render();});
render();
