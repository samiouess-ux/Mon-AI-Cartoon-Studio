const STORAGE_KEY = "mon-ai-cartoon-studio-v1";
const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"characters":[],"projects":[]}');
if (!Array.isArray(state.characters)) state.characters = [];
if (!Array.isArray(state.projects)) state.projects = [];
if (!Array.isArray(state.sharedReferenceImages)) state.sharedReferenceImages = [];
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
    const portrait = type === "characters" ? (item.image ? '<img class="character-portrait" src="'+item.image+'" alt="'+escapeHtml(item.name)+'">' : '<div class="character-placeholder">👤</div>') + '<label class="character-upload-label">Photo du personnage<input class="character-image-input" type="file" accept="image/*" data-character-image="'+index+'"></label>' : '';
    return '<div class="saved-item '+(type==="characters"?"character-item":"")+'">'+portrait+'<div class="saved-item-info"><strong>'+escapeHtml(item.name)+'</strong><small>'+escapeHtml(item.note||"")+'</small></div><div class="item-actions">'+openButton+'<button class="delete" data-type="'+type+'" data-index="'+index+'">Supprimer</button></div></div>';
  }).join("");
}
function render(){renderList("characters-list",state.characters,"characters");renderList("projects-list",state.projects,"projects");renderSharedReferences();}
function renderSharedReferences(){const target=document.getElementById("shared-reference-preview");if(!target)return;target.innerHTML=state.sharedReferenceImages.map((src,index)=>"<div class=\"shared-reference-thumb\"><img src=\""+src+"\" alt=\"Référence commune Julia et Lilo\"><button class=\"delete\" type=\"button\" data-remove-shared-reference=\""+index+"\">Retirer</button></div>").join("");}
function activeProject(){return state.projects.find(project=>project.id===activeProjectId);}
function buildImagePrompt(scene){
  const names=(scene.characters||"Julia, Lilo").split(",").map(name=>name.trim()).filter(Boolean);
  const characterDetails=names.map(name=>{
    const saved=state.characters.find(character=>character.name.trim().toLowerCase()===name.toLowerCase());
    return saved ? name+": "+(saved.note||"Use the attached reference image to preserve this character's exact appearance.") : name+": use the attached reference image as the main identity reference; preserve the same face, colors, proportions and recognizable features.";
  }).join("\n");
  return "Create one polished 3D animated cartoon film still for a family-friendly story.\n"+
    "SCENE: "+(scene.title||"Untitled scene")+"\n"+
    "VISUAL ACTION: "+(scene.action||"Show the characters naturally interacting in this moment.")+"\n"+
    "CHARACTERS:\n"+(characterDetails||"Use the attached character reference images and keep their appearance consistent.")+"\n"+
    "CONSISTENCY: Treat the supplied reference images as strict character identity guides. Do not redesign faces, hairstyles, fur colors, eye colors, body proportions or signature features. Keep each character recognizable and consistent with the references. Clothing may change only when the story requires it; do not change the character identity.\n"+
    "STYLE AND FORMAT: high-quality cute 3D animated movie look, expressive natural poses, beautiful soft cinematic lighting, detailed environment, coherent anatomy, vertical 9:16 composition, full scene clearly framed. No captions, no subtitles, no logos, no watermark, no written text.\n"+
    "REFERENCE IMAGES: Use the uploaded Julia and Lilo reference image(s) whenever those characters appear. Generate only this scene, not a collage or storyboard.";
}
function renderScenes(){
  const project=activeProject();if(!project)return;
  const target=document.getElementById("scenes-list");
  if(!project.scenes.length){target.innerHTML='<div class="empty-scenes">Aucune scène pour le moment. Appuyez sur « Préparer un découpage » ou ajoutez une scène.</div>';return;}
  target.innerHTML=project.scenes.map((scene,index)=>{const names=(scene.characters||"").split(",").map(name=>name.trim().toLowerCase());const refs=state.characters.filter(character=>names.includes(character.name.trim().toLowerCase())&&character.image);const hasDuo=names.includes("julia")&&names.includes("lilo");const sharedHtml=hasDuo&&state.sharedReferenceImages.length?"<div class=\"character-reference-strip shared-reference-strip\">"+state.sharedReferenceImages.map(src=>"<div class=\"character-reference\"><img src=\""+src+"\" alt=\"Référence commune Julia et Lilo\"><small>Julia + Lilo</small></div>").join("")+"</div>":"";const refsHtml=sharedHtml+(refs.length?'<div class="character-reference-strip">'+refs.map(character=>'<div class="character-reference"><img src="'+character.image+'" alt="'+escapeHtml(character.name)+'"><small>'+escapeHtml(character.name)+'</small></div>').join("")+'</div>':'<p class="muted character-reference-hint">Ajoutez une photo dans Personnages pour afficher ici les références automatiquement.</p>');return '<article class="scene-card"><div class="scene-top"><strong>Scène '+(index+1)+'</strong><button class="delete" type="button" data-remove-scene="'+index+'">Supprimer</button></div><div class="formrow"><label>Titre de la scène</label><input data-scene-index="'+index+'" data-scene-field="title" value="'+escapeHtml(scene.title)+'" placeholder="Ex. Le retour de Julia"></div><div class="formrow"><label>Action / description visuelle</label><textarea data-scene-index="'+index+'" data-scene-field="action" placeholder="Que voit-on dans cette scène ?">'+escapeHtml(scene.action)+'</textarea></div><div class="formrow"><label>Dialogue / voix</label><textarea data-scene-index="'+index+'" data-scene-field="dialogue" placeholder="Ex. Julia : Lilo, je suis rentrée !">'+escapeHtml(scene.dialogue)+'</textarea></div><div class="formrow"><label>Personnages présents</label><input data-scene-index="'+index+'" data-scene-field="characters" value="'+escapeHtml(scene.characters||"Julia, Lilo")+'" placeholder="Julia, Lilo"></div><div class="formrow"><label>Image de référence</label><input class="scene-image-input" type="file" accept="image/*" data-scene-image="'+index+'"><small class="muted">Choisissez une image depuis votre téléphone.</small>'+(scene.image?'<div class="scene-image-preview"><img src="'+scene.image+'" alt="Image de référence de la scène '+(index+1)+'"><button class="delete" type="button" data-remove-image="'+index+'">Retirer l’image</button></div>':'')+'</div>'<div class="scene-prompt-tools"><button class="btn secondary" type="button" data-build-prompt="'+index+'">✦ Préparer le prompt image</button><div class="scene-prompt-output" data-prompt-output="'+index+'" hidden><label>Prompt prêt à copier</label><textarea readonly data-prompt-text="'+index+'" rows="9"></textarea><button class="btn" type="button" data-copy-prompt="'+index+'">Copier le prompt</button></div></div>'+refsHtml+'</article>';}).join("");
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

document.getElementById("shared-reference-input").addEventListener("change",async event=>{
  const files=Array.from(event.target.files||[]).filter(file=>file.type.startsWith("image/")).slice(0,2);
  if(!files.length)return;
  const compressImage=file=>new Promise((resolve,reject)=>{
    const reader=new FileReader();reader.onerror=reject;reader.onload=()=>{
      const img=new Image();img.onerror=reject;img.onload=()=>{
        const max=1000;const scale=Math.min(1,max/Math.max(img.width,img.height));
        const canvas=document.createElement("canvas");canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);
        canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL("image/jpeg",0.70));
      };img.src=reader.result;
    };reader.readAsDataURL(file);
  });
  try{state.sharedReferenceImages=await Promise.all(files.map(compressImage));save();renderSharedReferences();renderScenes();}
  catch(error){alert("Impossible d’enregistrer ces photos. Essayez des images plus légères.");}
  event.target.value="";
});
document.getElementById("shared-reference-preview").addEventListener("click",event=>{
  const button=event.target.closest("[data-remove-shared-reference]");if(!button)return;
  state.sharedReferenceImages.splice(Number(button.dataset.removeSharedReference),1);save();renderSharedReferences();renderScenes();
});
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
document.getElementById("characters-list").addEventListener("change",event=>{
  const input=event.target.closest("[data-character-image]");if(!input||!input.files?.[0])return;
  const character=state.characters[Number(input.dataset.characterImage)];if(!character)return;
  const file=input.files[0];if(!file.type.startsWith("image/")){alert("Veuillez choisir une image.");return;}
  const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const max=1000;const scale=Math.min(1,max/Math.max(img.width,img.height));const canvas=document.createElement("canvas");canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);character.image=canvas.toDataURL("image/jpeg",0.76);try{save();render();renderScenes();}catch(error){delete character.image;alert("L’image est trop volumineuse. Essayez une image plus légère.");}};img.onerror=()=>alert("Impossible de lire cette image.");img.src=reader.result;};reader.readAsDataURL(file);
});
document.getElementById("scenes-list").addEventListener("change",event=>{
  const input=event.target.closest("[data-scene-image]");if(!input||!input.files?.[0])return;
  const project=activeProject();if(!project)return;const scene=project.scenes[Number(input.dataset.sceneImage)];if(!scene)return;
  const file=input.files[0];if(!file.type.startsWith("image/")){alert("Veuillez choisir une image.");return;}
  const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const max=1200;const scale=Math.min(1,max/Math.max(img.width,img.height));const canvas=document.createElement("canvas");canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);scene.image=canvas.toDataURL("image/jpeg",0.76);try{save();renderScenes();}catch(error){scene.image="";alert("L’image est trop volumineuse pour le stockage disponible. Essayez une image plus légère.");}};img.onerror=()=>alert("Impossible de lire cette image.");img.src=reader.result;};reader.readAsDataURL(file);
});
document.getElementById("scenes-list").addEventListener("click",async event=>{
  const build=event.target.closest("[data-build-prompt]");
  if(build){const project=activeProject();const index=Number(build.dataset.buildPrompt);const scene=project?.scenes[index];if(!scene)return;const output=document.querySelector('[data-prompt-output="'+index+'"]');const field=document.querySelector('[data-prompt-text="'+index+'"]');field.value=buildImagePrompt(scene);output.hidden=false;return;}
  const copy=event.target.closest("[data-copy-prompt]");
  if(copy){const index=Number(copy.dataset.copyPrompt);const field=document.querySelector('[data-prompt-text="'+index+'"]');if(!field)return;try{await navigator.clipboard.writeText(field.value);copy.textContent="Copié ✓";}catch(error){field.focus();field.select();const ok=document.execCommand("copy");copy.textContent=ok?"Copié ✓":"Sélectionnez le texte pour le copier";}return;}
  const remove=event.target.closest("[data-remove-image]");if(!remove)return;const project=activeProject();if(!project)return;const scene=project.scenes[Number(remove.dataset.removeImage)];if(scene){delete scene.image;save();renderScenes();}});
document.getElementById("scenes-list").addEventListener("input",event=>{
  const field=event.target.dataset.sceneField;if(!field)return;
  const project=activeProject();if(!project)return;
  const scene=project.scenes[Number(event.target.dataset.sceneIndex)];if(!scene)return;
  scene[field]=event.target.value;save();
});
render();
