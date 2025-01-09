window.addEventListener('load', function() {
    
});



const cardFront = document.querySelector('.front');
const cardBack = document.querySelector('.back');

cardFront.addEventListener('click', function() {
    cardBack.style.display = 'block';
    cardFront.style.display = 'none';
});

cardBack.addEventListener('click', function() {
    cardFront.style.display = 'block';
    cardBack.style.display = 'none';
});


const menu = document.querySelector('.menu');

const addProfileBtn = document.querySelector('.addProfileBtn');
const addProfileInput = document.querySelector('.addProfileInput');
const addProfileBar = document.querySelector('.wrapper');
const profiles = JSON.parse(localStorage.getItem('profiles')) || [];
const profileOptionContainer = document.querySelector('.profileOptionContainer');

const readCard = document.querySelector('.readCard');
const showCard = document.querySelector('.showCard');
const showCardTitle = document.querySelector('.showCardTitle');
const menuBtnContainer = document.querySelector('.menuBtnContainer');

let flashcards = [];
let i = 0;  // current index
let profileObjs = JSON.parse(localStorage.getItem('profileObj')) || [];


profiles.forEach((profile) => {
    AddProfile(profile);
});

addProfileBtn.addEventListener('click', function() {
    const profileName = addProfileInput.value;
    if (!profileName) return;

    if (profiles.includes(profileName)) {
        alert('Profile already exists');
        return;
    }

    if (profileName.length > 20) {
        alert('Profile name cannot exceed 20 characters');
        return;
    }

    addProfileInput.value = '';

    profiles.push(profileName);
    localStorage.setItem('profiles', JSON.stringify(profiles));

    let profileObj = {
        name: profileName,
        timeAdded: Date.now(),
        lastAccessed: Date.now()
    }
    profileObjs.push(profileObj);
    localStorage.setItem('profileObj', JSON.stringify(profileObjs));

    AddProfile(profileName);

    SortProfiles();
});

function AddProfile(profileName) {

    menu.innerHTML += `<div class="profileContainer">
            <button class="profile" id="${profileName}">${profileName}</button>
            <i class="fa-regular fa-square-minus deleteProfileBtn"></i>
        </div>`;

    
    
    const profileBtns = document.querySelectorAll('.profile');
    profileBtns.forEach((btn) => {
        btn.addEventListener('click', function() {
            addProfileBar.style.display = 'none';
            profileOptionContainer.style.display = 'none';
            menu.style.display = 'none';
            showCard.style.display = 'block';
            menuBtnContainer.style.display = 'block';
            showCardTitle.textContent = btn.textContent;
            const key = btn.textContent + '-flashcards';
            flashcards = JSON.parse(localStorage.getItem(key)) || [];
            RenderCards();

            const findProfile = profileObjs.find((profileObj) => profileObj.name === btn.textContent);
            findProfile ? findProfile.lastAccessed = Date.now() : null;
            localStorage.setItem('profileObj', JSON.stringify(profileObjs));
        });
    });

    const deleteProfileBtns = document.querySelectorAll('.deleteProfileBtn');
    deleteProfileBtns.forEach((btn) => {
        btn.addEventListener('click', function() {
            confirm('Are you sure you want to delete this profile?') ? DeleteProfile(btn) : null;
        });
    });
}

function DeleteProfile(btn) {

    const btnTextContent = btn.previousElementSibling.textContent;
    const deleteKey = btnTextContent + '-flashcards';
    localStorage.removeItem(deleteKey);

    
    const findProfile = profileObjs.find((obj) => obj.name === btnTextContent);

    findProfile ? profileObjs.splice(profileObjs.indexOf(findProfile), 1) : null;
    localStorage.setItem('profileObj', JSON.stringify(profileObjs));
    
    const nameToDelete = btnTextContent;
    profiles.splice(profiles.indexOf(nameToDelete), 1);
    localStorage.setItem('profiles', JSON.stringify(profiles));
    menu.innerHTML = '';
    profiles.forEach((profile) => {
        AddProfile(profile);
    });

    
}


const addCardBtn = document.querySelector('.addCardBtn');
const addCardQuestion = document.querySelector('.question');
const addCardAnswer = document.querySelector('.answer');

const cardContainer = document.querySelector('.cardContainer');

function RenderCards() {
    cardContainer.innerHTML = '';
    flashcards.forEach((flashcard) => {
        cardContainer.innerHTML += `
            <div class="card">
                <div class="questionCard"><p>${FormatTextRender(flashcard.question)}</p></div>
                <hr/>
                <div class="answerCard"><p>${FormatTextRender(flashcard.answer)}</p></div>
                <i class="fa-regular fa-square-minus deleteBtn"></i>
            </div>
        `;
    });

    const deleteBtns = document.querySelectorAll('.deleteBtn');
    deleteBtns.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            flashcards.splice(index, 1);
            const key = showCardTitle.textContent + '-flashcards';
            localStorage.setItem(key, JSON.stringify(flashcards));
            RenderCards();
        });
    });
}

addCardBtn.addEventListener('click', function() {
    const question = FormatTextSave(addCardQuestion.value);
    const answer = FormatTextSave(addCardAnswer.value);
    
    if (!question || !answer) {
        alert('Please fill out both fields');
        return;
    }
    addCardQuestion.value = '';
    addCardAnswer.value = '';

    flashcards.push({question, answer});
    const key = showCardTitle.textContent + '-flashcards';
    localStorage.setItem(key, JSON.stringify(flashcards));
    RenderCards();
});


const menuBtn = document.querySelector('.menuBtn');

menuBtn.addEventListener('click', function() {
    addProfileBar.style.display = 'flex';
    profileOptionContainer.style.display = 'flex';
    menu.style.display = 'grid';
    showCard.style.display = 'none';
    menuBtnContainer.style.display = 'none';
    readCard.style.display = 'none';

    SortProfiles();
});


const playBtn = document.querySelector('.playBtn');
const questionCard = document.querySelector('.questionCardContainer');
const answerCard = document.querySelector('.answerCardContainer');
const nextBtn = document.querySelector('.nextBtn');
const prevBtn = document.querySelector('.prevBtn');
const editBtn = document.querySelector('.editBtn');
const readCardIndex = document.querySelector('.index');
const readCardTotal = document.querySelector('.total');

playBtn.addEventListener('click', function() {
    if (flashcards.length === 0) {
        alert('No flashcards to read');
        return;
    }

    i = 0;
    readCard.style.display = 'block';
    showCard.style.display = 'none';

    questionCard.innerHTML = `<p class="questionCard">${FormatTextRender(flashcards[i].question)}</p>`;
    answerCard.innerHTML = `<p class="answerCard">${FormatTextRender(flashcards[i].answer)}</p>`;

    cardFront.style.display = 'block';
    cardBack.style.display = 'none';

    readCardTotal.textContent = flashcards.length;
    readCardIndex.textContent = 1;
});

nextBtn.addEventListener('click', function() {
    i = (i + 1) % flashcards.length;
    questionCard.innerHTML = `<p class="questionCard">${FormatTextRender(flashcards[i].question)}</p>`;
    answerCard.innerHTML = `<p class="answerCard">${FormatTextRender(flashcards[i].answer)}</p>`;
    cardFront.style.display = 'block';
    cardBack.style.display = 'none';
    readCardIndex.textContent = i + 1;
});

prevBtn.addEventListener('click', function() {
    i = (i - 1 + flashcards.length) % flashcards.length;
    questionCard.innerHTML = `<p class="questionCard">${FormatTextRender(flashcards[i].question)}</p>`;
    answerCard.innerHTML = `<p class="answerCard">${FormatTextRender(flashcards[i].answer)}</p>`;
    cardFront.style.display = 'block';
    cardBack.style.display = 'none';
    readCardIndex.textContent = i + 1;
});

editBtn.addEventListener('click', function() {
    showCard.style.display = 'block';
    readCard.style.display = 'none';
});

function FormatTextSave(text) {
    return text.replace(/(?:\r\n|\r|\n)/g, '\\n').replace(/ {4}/g, '\\t').replace(/\\t/g, '&emsp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function FormatTextRender(text) {
    return text.replace(/(?:\r\n|\r|\n|\\n)/g, '<br>').replace(/\\t/g, '&emsp;');
}



const minutes = document.querySelector('.timerMin');
const seconds = document.querySelector('.timerSec');
const timerPlayBtn = document.querySelector('.timerPlayBtn');
const timerSwitchBtn = document.querySelector('.timerSwitchBtn');
const timerTitle = document.querySelector('.timerTitle');

let timer = null;
let timerOn = false;
let remainingTime = 1500;  // 25 minutes
let timerMode = "Work";

timerPlayBtn.addEventListener('click', function() {
    if (timerOn) {
        clearInterval(timer);
        timerOn = false;
        timerPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        timer = setInterval(UpdateTimer, 1000);
        timerOn = true;
        timerPlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
    }
});

timerSwitchBtn.addEventListener('click', function() {
    if (timerOn) {
        clearInterval(timer);
        timerOn = false;
        timerPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
    }

    if (timerMode === "Work") {
        SwitchToBreak();
    }
    else {
        SwitchToWork();
    }
});

function UpdateTimer() {
    remainingTime -= 1;

    const min = Math.floor(remainingTime / 60);
    const sec = remainingTime % 60;
    minutes.textContent = min.toString().padStart(2, '0');
    seconds.textContent = sec.toString().padStart(2, '0');

    if (remainingTime < 0) {
        clearInterval(timer);
        timerOn = false;
        timerPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
        if (timerMode === "Work") {
            alert('Time to take a break!');
            SwitchToBreak();
        }
        else {
            alert('Time to get back to work!');
            SwitchToWork();
        }
        return;
    }
}

function SwitchToBreak() {
    timerMode = "Break";
    timerTitle.textContent = "Break";
    remainingTime = 300;  // 5 minutes
    minutes.textContent = '05';
    seconds.textContent = '00';
}

function SwitchToWork() {
    timerMode = "Work";
    timerTitle.textContent = "Work";
    remainingTime = 1500;  // 25 minutes
    minutes.textContent = '25';
    seconds.textContent = '00';
}


const timerMinimizeBtn = document.querySelector('.fa-window-minimize');
const timerMinimized = document.querySelector('.timerMinimized');
const timerContainer = document.querySelector('.timerContainer');

timerMinimizeBtn.addEventListener('click', function() {
    timerContainer.style.display = 'none';
    timerMinimized.style.display = 'flex';
});

timerMinimized.addEventListener('click', function() {
    timerContainer.style.display = 'flex';
    timerMinimized.style.display = 'none';
});



const profileSort = document.querySelector('.profileSort');

let sortedProfiles = [];

SortProfiles();

profileSort.addEventListener('change', function() {
    localStorage.setItem('sortOption', profileSort.value);
    SortProfiles();
});

function SortProfiles() {
    const loadSortOption = localStorage.getItem('sortOption');
    profileSort.value = loadSortOption;
    switch (loadSortOption) {
        case 'timeAddedAsc':
            sortedProfiles = profileObjs.sort((a, b) => new Date(a.timeAdded) - new Date(b.timeAdded));
            break;
        case 'timeAddedDesc':
            sortedProfiles = profileObjs.sort((a, b) => new Date(b.timeAdded) - new Date(a.timeAdded));
            break
        case 'nameAsc':
            sortedProfiles = profileObjs.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'nameDesc':
            sortedProfiles = profileObjs.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'lastAccessedAsc':
            sortedProfiles = profileObjs.sort((a, b) => new Date(a.lastAccessed) - new Date(b.lastAccessed));
            break;
        case 'lastAccessedDesc':
            sortedProfiles = profileObjs.sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed));
            break;
    }

    menu.innerHTML = '';
    sortedProfiles.forEach((profile) => {
        AddProfile(profile.name);
    });
}



const profileEditBtn = document.querySelector('.profileEditBtn');
const editProfileContainer = document.querySelector('.editProfileContainer');
const editProfile = document.querySelector('.editProfile');
const closeEditProfile = document.querySelector('.closeEditProfile');


profileEditBtn.addEventListener('click', function() {
    editProfileContainer.style.display = 'flex';

    document.body.style.overflow = 'hidden';
    editProfileContainer.scrollTop = 0;

    RenderProfilesInManage();
});

closeEditProfile.addEventListener('click', function() {
    editProfileContainer.style.display = 'none';
    document.body.style.overflow = 'auto';
});

function DeleteProfileInManage(btn) {
    const btnTextContent = btn.previousElementSibling.previousElementSibling.value;
    const deleteKey = btnTextContent + '-flashcards';
    localStorage.removeItem(deleteKey);

    const findProfile = profileObjs.find((obj) => obj.name === btnTextContent);
    findProfile ? profileObjs.splice(profileObjs.indexOf(findProfile), 1) : null;
    localStorage.setItem('profileObj', JSON.stringify(profileObjs));

    profiles.splice(profiles.indexOf(btnTextContent), 1);
    localStorage.setItem('profiles', JSON.stringify(profiles));

    SortProfiles();
    RenderProfilesInManage();
}

function RenderProfilesInManage() {
    editProfile.innerHTML = `<p class="manageProfileTitle">Manage Profiles</p>
        <i class="fa-solid fa-xmark closeManageBtn"></i>`;
    sortedProfiles.forEach((profile) => {
        editProfile.innerHTML += `<div class="editProfileItem">
            <input class="editProfileInput" value="${profile.name}" readonly/>
            <button class="editProfileNameBtn">Edit</button>
            <button class="deleteProfileNameBtn">Delete</button>
        </div>`;
    });

    const closeManageBtn = document.querySelector('.closeManageBtn');
    closeManageBtn.addEventListener('click', function() {
        editProfileContainer.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    const editProfileNameBtn = document.querySelectorAll('.editProfileNameBtn');
    const deleteProfileNameBtn = document.querySelectorAll('.deleteProfileNameBtn');
    const editProfileInput = document.querySelectorAll('.editProfileInput');

    editProfileNameBtn.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            if (editProfileInput[index].readOnly) {
                editProfileInput[index].readOnly = false;
                editProfileInput[index].focus();
                editProfileInput[index].select();
                btn.textContent = 'Save';

                for (let i = 0; i < editProfileInput.length; i++) {
                    if (!editProfileInput[i].readOnly && i !== index) {
                        editProfileInput[i].readOnly = true;
                        editProfileNameBtn[i].textContent = 'Edit';
                        editProfileInput[i].value = sortedProfiles[i].name;
                    }
                }
            } 
            else {
                if (!editProfileInput[index].value) {
                    alert('Profile name cannot be empty');
                    return;
                }

                if (editProfileInput[index].value.length > 20) {
                    alert('Profile name cannot exceed 20 characters');
                    return;
                }

                const oldProfileName = sortedProfiles[index].name;
                const newProfileName = editProfileInput[index].value;

                if (profiles.includes(editProfileInput[index].value) && oldProfileName !== newProfileName) {
                    alert('Profile already exists');
                    return;
                }

                const key = oldProfileName + '-flashcards';
                const newKey = newProfileName + '-flashcards';
                const flashcards = JSON.parse(localStorage.getItem(key)) || [];
                if (flashcards.length !== 0) {
                    localStorage.setItem(newKey, JSON.stringify(flashcards));
                }
                localStorage.removeItem(key);

                profiles[profiles.indexOf(oldProfileName)] = newProfileName;
                localStorage.setItem('profiles', JSON.stringify(profiles));

                profileObjs[profileObjs.indexOf(sortedProfiles[index])].name = newProfileName;
                localStorage.setItem('profileObj', JSON.stringify(profileObjs));

                editProfileInput[index].readOnly = true;
                btn.textContent = 'Edit';

                menu.innerHTML = '';
                sortedProfiles.forEach((profile) => {
                    AddProfile(profile.name);
                });
            }
        });
    });

    deleteProfileNameBtn.forEach((btn) => {
        btn.addEventListener('click', function() {
            confirm('Are you sure you want to delete this profile?') ? DeleteProfileInManage(btn) : null;
        });
    });
}


