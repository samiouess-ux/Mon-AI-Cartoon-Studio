const STORAGE_KEY = "mon-ai-cartoon-studio-v1";
const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"characters":[],"projects":[]}');
if (!Array.isArray(state.characters)) state.characters = [];
if (!Array.isArray(state.projects)) state.projects = [];
state.projects.forEach((project, index) => {
  if (!project.id) project.id = String(Date.now() + index);
  if (!Array.isArray(project.scenes)) project.scenes = [];
});
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let activeProjectId = null;
function renderList(targetId, items, type){
  const target=document.getElementById(targetId);
  if(!items.length){target.innerHTML='<p class="muted">Rien pour le moment. Ajoutez votre premier élément.</p>';return;}
  target.innerHTML=items.map((item,index)=>{
    const openButton = type === "projects" ? '<button class="open-project" data-open-project="'+escapeHtml(item.id)+'">Ouvrir l’atelier</button>' : '';
    return '<div class="saved-item"><div><strong>'+escapeHtml(item.name)+'</strong><small>'+escapeHtml(item.note||"")+'</small></div><div class="item-actions">'+openButton+'<button class="delete" data-type="'+type+'" data-index="'+index+'">Supprimer</button></div></div>';
  }).join("");
}
function render(){renderList("characters-list",state.characters,"characters");renderList("projects-list",state.projects,"projects");}
function activeProject(){return state.projects.find(project=>project.id===activeProjectId);}
function renderScenes(){
  const project=activeProject();if(!project)return;
  const target=document.getElementById("scenes-list");
  if(!project.scenes.length){target.innerHTML='<div class="empty-scenes">Aucune scène pour le moment. Appuyez sur « Préparer un découpage » ou ajoutez une scène.</div>';return;}
  target.innerHTML=project.scenes.map((scene,index)=>'<article class="scene-card"><div class="scene-top"><strong>Scène '+(index+1)+'</strong><button class="delete" type="button" data-remove-scene="'+index+'">Supprimer</button></div><div class="formrow"><label>Titre de la scène</label><input data-scene-index="'+index+'" data-scene-field="title" value="'+escapeHtml(scene.title)+'" placeholder="Ex. Le retour de Julia"></div><div class="formrow"><label>Action / description visuelle</label><textarea data-scene-index="'+index+'" data-scene-field="action" placeholder="Que voit-on dans cette scène ?">'+escapeHtml(scene.action)+'</textarea></div><div class="formrow"><label>Dialogue / voix</label><textarea data-scene-index="'+index+'" data-scene-field="dialogue" placeholder="Ex. Julia : Lilo, je suis rentrée !">'+escapeHtml(scene.dialogue)+'</textarea></div><div class="formrow"><label>Personnages présents</label><input data-scene-index="'+index+'" data-scene-field="characters" value="'+escapeHtml(scene.characters||"Julia, Lilo")+'" placeholder="Julia, Lilo"></div><div class="formrow"><label>Image de référence</label><input class="scene-image-input" type="file" accept="image/*" data-scene-image="'+index+'"><small class="muted">Choisissez une image depuis votre téléphone.</small>'+(scene.image?'<div class="scene-image-preview"><img src="'+scene.image+'" alt="Image de référence de la scène '+(index+1)+'"><button class="delete" type="button" data-remove-image="'+index+'">Retirer l’image</button></div>':'')+'</div></article>').join("");
}
function openProject(id){
  const project=state.projects.find(item=>item.id===id);if(!project)return;
  activeProjectId=id;
  document.getElementById("story-editor").hidden=false;
  document.getElementById("editor-title").textContent="✍️ "+project.name;
  document.getElementById("editor-summary").textContent=project.note||"Ajoutez votre résumé dans les champs de chaque scène.";
  renderScenes();
  document.getElementById("story-editor").scrollIntoView({behavior:"smooth",block:"start"});
}
function addScene(action="",title=""){
  const project=activeProject();if(!project)return;
  project.scenes.push({title:title||"Nouvelle scène",action,dialogue:"",characters:"Julia, Lilo"});
  save();renderScenes();
}
document.getElementById("character-form").addEventListener("submit",event=>{event.preventDefault();const name=document.getElementById("character-name").value.trim();const note=document.getElementById("character-note").value.trim();if(!name)return;state.characters.push({name,note});save();event.target.reset();render();});
document.getElementById("project-form").addEventListener("submit",event=>{event.preventDefault();const name=document.getElementById("project-name").value.trim();const note=document.getElementById("project-note").value.trim();if(!name)return;state.projects.push({id:String(Date.now()),name,note,scenes:[]});save();event.target.reset();render();});
document.addEventListener("click",event=>{
  const open=event.target.closest("[data-open-project]");
  if(open){openProject(open.dataset.openProject);return;}
  const removeScene=event.target.closest("[data-remove-scene]");
  if(removeScene){const project=activeProject();if(project){project.scenes.splice(Number(removeScene.dataset.removeScene),1);save();renderScenes();}return;}
  const button=event.target.closest("[data-type]");
  if(button){const type=button.dataset.type;const index=Number(button.dataset.index);const removed=state[type][index];state[type].splice(index,1);if(type==="projects"&&removed?.id===activeProjectId){activeProjectId=null;document.getElementById("story-editor").hidden=true;}save();render();}
});
document.getElementById("draft-scenes").addEventListener("click",()=>{
  const project=activeProject();if(!project)return;
  const sentences=(project.note||"").split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean);
  if(!sentences.length){addScene();return;}
  project.scenes=sentences.map((sentence,index)=>({title:"Scène "+(index+1),action:sentence,dialogue:"",characters:"Julia, Lilo"}));
  save();renderScenes();
});
document.getElementById("add-scene").addEventListener("click",()=>addScene());
document.getElementById("scenes-list").addEventListener("change",event=>{\n  const input=event.target.closest("[data-scene-image]");if(!input||!input.files?.[0])return;\n  const project=activeProject();if(!project)return;const scene=project.scenes[Number(input.dataset.sceneImage)];if(!scene)return;\n  const file=input.files[0];if(!file.type.startsWith("image/")){alert("Veuillez choisir une image.");return;}\n  const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const max=1200;const scale=Math.min(1,max/Math.max(img.width,img.height));const canvas=document.createElement("canvas");canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);scene.image=canvas.toDataURL("image/jpeg",0.76);try{save();renderScenes();}catch(error){scene.image="";alert("L’image est trop volumineuse pour le stockage disponible. Essayez une image plus légère.");}};img.onerror=()=>alert("Impossible de lire cette image.");img.src=reader.result;};reader.readAsDataURL(file);\n});\ndocument.getElementById("scenes-list").addEventListener("click",event=>{const remove=event.target.closest("[data-remove-image]");if(!remove)return;const project=activeProject();if(!project)return;const scene=project.scenes[Number(remove.dataset.removeImage)];if(scene){delete scene.image;save();renderScenes();}});\ndocument.getElementById("scenes-list").addEventListener("input",event=>{
  const field=event.target.dataset.sceneField;if(!field)return;
  const project=activeProject();if(!project)return;
  const scene=project.scenes[Number(event.target.dataset.sceneIndex)];if(!scene)return;
  scene[field]=event.target.value;save();
});
render();
