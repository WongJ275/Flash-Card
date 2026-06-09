import { 
    LoadDecks, LoadCards, UpdateDeckName, UpdateDeckLastAccessed, 
    AddDeckData, DeleteDeckData, AddCardData, DeleteCardData, 
    LoadStringLocalStorage, SaveStringLocalStorage
} from "./data.js";

import { supabase, CheckSession } from "./supabaseClient.js";
import { ShowLoadingScreen, HideLoadingScreen } from "./utils.js";

supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
        window.location.href = 'login.html';
    }
    else if (event === "SIGNED_IN" && session) {

        const metadata = session.user.user_metadata;
        const shouldInherit = metadata ? metadata.shouldInherit : false;

        if (shouldInherit === true) {
            window.location.href = "login.html";
            return;
        }

        BackToMenu();
        init();
    }
});

CheckSession().then(session => {
    // if logged in
    if (session) return;

    const hasVisited = localStorage.getItem('hasVisitedBefore');

    // first time visiting -> show login page
    if (!hasVisited) {
        localStorage.setItem('hasVisitedBefore', '1');
        window.location.href = 'login.html';
    } 
});

const menu = document.querySelector('.menu');

const addDeckBtn = document.querySelector('.addDeckBtn');
const addDeckInput = document.querySelector('.addDeckInput');
const addDeckBar = document.querySelector('.addDeckWrapper');
const deckOptionContainer = document.querySelector('.deckOptionContainer');

const readCard = document.querySelector('.readCard');
const showCard = document.querySelector('.showCard');
const showCardTitle = document.querySelector('.showCardTitle');

const deckSort = document.querySelector('.deckSort');

let flashcards = [];
let cardIndex = 0;  // current index

let decks = [];

async function init() {
    console.log("init called");
    try {
        decks = await LoadDecks();
        SortDecks();
    }
    catch (err) {
        console.error("Error initializing:", err);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    ShowLoadingScreen();
    await init();
    HideLoadingScreen();
})

menu.addEventListener('click', async function(e) {
    // Open deck
    if (e.target.classList.contains('deck')) {
        addDeckBar.classList.add("hidden");
        deckOptionContainer.classList.add("hidden");
        menu.classList.add("hidden");
        showCard.classList.remove("hidden");
        menuBtn.classList.remove("hidden");

        const deckID_or_name = e.target.parentElement.dataset.id;
        showCardTitle.dataset.id = deckID_or_name;
        showCardTitle.textContent = e.target.textContent;

        ShowLoadingScreen();
        flashcards = await LoadCards(deckID_or_name);
        RenderCards();
        HideLoadingScreen();

        decks = await UpdateDeckLastAccessed(deckID_or_name, decks);
    }
    // Delete deck from menu
    else if (e.target.classList.contains('deleteDeckBtn')) {
        confirm(`Are you sure you want to delete deck (${e.target.previousElementSibling.textContent})?`) 
            ? DeleteDeck(e.target) : null;
    }
});

addDeckBtn.addEventListener('click', function() {
    AddDeckBtn();
});

addDeckInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        AddDeckBtn();
    }
});

async function AddDeckBtn() {
    const deckName = addDeckInput.value;
    if (!deckName) return;

    if (decks && decks.some(deck => deck.name === deckName)) {
        alert('Deck already exists');
        return;
    }

    if (deckName.length > 20) {
        alert('Deck name cannot exceed 20 characters');
        return;
    }

    addDeckInput.value = '';

    ShowLoadingScreen();
    decks = await AddDeckData(deckName, decks);
    SortDecks();
    HideLoadingScreen();
}

function AddDeck(deck) {
    const container = document.createElement('div');
    container.className = 'deckContainer';

    const deckId = deck.id || deck.name; 
    container.dataset.id = deckId;

    const btn = document.createElement('button');
    btn.className = 'deck';
    btn.textContent = deck.name; 

    const icon = document.createElement('i');
    icon.className = 'fa-regular fa-square-minus deleteDeckBtn';

    container.appendChild(btn);
    container.appendChild(icon);
    menu.appendChild(container);
}

async function DeleteDeck(btn) {
    ShowLoadingScreen();
    decks = await DeleteDeckData(btn.parentElement.dataset.id, decks);
    SortDecks();
    btn.parentElement.remove();
    HideLoadingScreen();
}


/* Flashcards */

const addCardBtn = document.querySelector('.addCardBtn');
const addCardQuestion = document.querySelector('.question');
const addCardAnswer = document.querySelector('.answer');

const cardContainer = document.querySelector('.cardContainer');


function RenderCards() {
    cardContainer.innerHTML = '';
    flashcards.forEach((flashcard) => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        
        if (flashcard.id) {
            cardDiv.dataset.id = flashcard.id;
        }

        /*cardDiv.innerHTML = `
            <div class="questionCard"><p>${FormatTextRender(flashcard.question)}</p></div>
            <hr/>
            <div class="answerCard"><p>${FormatTextRender(flashcard.answer)}</p></div>
            <i class="fa-regular fa-square-minus deleteBtn"></i>
        `;*/

        const questionDiv = document.createElement('div');
        questionDiv.className = 'questionCard';
        const questionP = document.createElement('p');
        questionP.textContent = flashcard.question; 
        questionDiv.appendChild(questionP);

        const answerDiv = document.createElement('div');
        answerDiv.className = 'answerCard';
        const answerP = document.createElement('p');
        answerP.textContent = flashcard.answer; 
        answerDiv.appendChild(answerP);

        const deleteIcon = document.createElement('i');
        deleteIcon.className = 'fa-regular fa-square-minus deleteBtn';

        cardDiv.appendChild(questionDiv);
        cardDiv.appendChild(document.createElement('hr'));
        cardDiv.appendChild(answerDiv);
        cardDiv.appendChild(deleteIcon);

        cardContainer.appendChild(cardDiv);
    });
}

cardContainer.addEventListener('click', async function(e) {
    if (e.target.classList.contains('deleteBtn')) {
        const index = Array.from(e.target.parentElement.parentElement.children)
            .indexOf(e.target.parentElement);

        ShowLoadingScreen();
        const cardID = e.target.parentElement.dataset.id;
        let result = await DeleteCardData(
            cardID ? cardID : null, 
            showCardTitle.dataset.id, 
            index, 
            flashcards
        );

        if (result && result.length !== flashcards.length) {
            flashcards = result;
            cardContainer.removeChild(e.target.parentElement);
        } else {
            alert("Failed to delete card");
        }

        HideLoadingScreen();
    }
});

addCardQuestion.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        addCardQuestion.value += '    ';
    }
});

addCardAnswer.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        addCardAnswer.value += '    ';
    }
});
 
addCardBtn.addEventListener('click', async function() {
    //const question = FormatTextSave(addCardQuestion.value);
    //const answer = FormatTextSave(addCardAnswer.value);

    const question = addCardQuestion.value;
    const answer = addCardAnswer.value;
    
    if (!question || !answer) {
        alert('Please fill out both fields');
        return;
    }
    addCardQuestion.value = '';
    addCardAnswer.value = '';

    ShowLoadingScreen();
    flashcards = await AddCardData(
        showCardTitle.dataset.id, question, answer, flashcards
    );

    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';

    const newCard = flashcards[flashcards.length - 1];
    
    if (newCard.id) {
        cardDiv.dataset.id = newCard.id;
    }

    /*cardDiv.innerHTML = `
        <div class="questionCard"><p>${FormatTextRender(question)}</p></div>
        <hr/>
        <div class="answerCard"><p>${FormatTextRender(answer)}</p></div>
        <i class="fa-regular fa-square-minus deleteBtn"></i>
    `;*/

    const questionDiv = document.createElement('div');
    questionDiv.className = 'questionCard';
    const questionP = document.createElement('p');
    questionP.textContent = question; 
    questionDiv.appendChild(questionP);

    const answerDiv = document.createElement('div');
    answerDiv.className = 'answerCard';
    const answerP = document.createElement('p');
    answerP.textContent = answer; 
    answerDiv.appendChild(answerP);

    const deleteIcon = document.createElement('i');
    deleteIcon.className = 'fa-regular fa-square-minus deleteBtn';

    cardDiv.appendChild(questionDiv);
    cardDiv.appendChild(document.createElement('hr'));
    cardDiv.appendChild(answerDiv);
    cardDiv.appendChild(deleteIcon);

    cardContainer.appendChild(cardDiv);

    HideLoadingScreen();
});

const cardFront = document.querySelector('.front');
const cardBack = document.querySelector('.back');

cardFront.addEventListener('click', function() {
    cardBack.classList.remove("hidden");
    cardBack.scrollTop = 0;
    cardFront.classList.add("hidden");
});

cardBack.addEventListener('click', function() {
    cardFront.classList.remove("hidden");
    cardFront.scrollTop = 0;
    cardBack.classList.add("hidden");
});


/* Back to Menu */

const menuBtn = document.querySelector('.menuBtn');

menuBtn.addEventListener('click', BackToMenu);

function BackToMenu() {
    addDeckBar.classList.remove("hidden");
    deckOptionContainer.classList.remove("hidden");
    menu.classList.remove("hidden");
    showCard.classList.add("hidden");
    menuBtn.classList.add("hidden");
    readCard.classList.add("hidden");

    cardContainer.innerHTML = '';

    const loadSortOption = LoadStringLocalStorage('sortOption');
    if (loadSortOption === 'lastAccessedAsc' || loadSortOption === 'lastAccessedDesc') {
        SortDecks();
    }
}


/* Read Flashcards */

const playBtn = document.querySelector('.playBtn');
const questionCardContent = document.querySelector('.readQ');
const answerCardContent = document.querySelector('.readA');
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

    cardIndex = 0;
    readCard.classList.remove("hidden");
    showCard.classList.add("hidden");

    questionCardContent.textContent = flashcards[cardIndex].question;
    answerCardContent.textContent = flashcards[cardIndex].answer;

    //questionCard.innerHTML = `<p class="questionCard readQ">${FormatTextRender(flashcards[cardIndex].question)}</p>`;
    //answerCard.innerHTML = `<p class="answerCard readA">${FormatTextRender(flashcards[cardIndex].answer)}</p>`;
    
    cardFront.style.scrollTop = 0;

    cardFront.classList.remove("hidden");
    cardBack.classList.add("hidden");

    readCardTotal.textContent = flashcards.length;
    readCardIndex.textContent = 1;
});

nextBtn.addEventListener('click', function() {
    cardIndex = (cardIndex + 1) % flashcards.length;

    questionCardContent.textContent = flashcards[cardIndex].question;
    answerCardContent.textContent = flashcards[cardIndex].answer;
    
    cardFront.style.scrollTop = 0;
    cardFront.classList.remove("hidden");
    cardBack.classList.add("hidden");
    readCardIndex.textContent = cardIndex + 1;
});

prevBtn.addEventListener('click', function() {
    cardIndex = (cardIndex - 1 + flashcards.length) % flashcards.length;

    questionCardContent.textContent = flashcards[cardIndex].question;
    answerCardContent.textContent = flashcards[cardIndex].answer;

    cardFront.style.scrollTop = 0;
    cardFront.classList.remove("hidden");
    cardBack.classList.add("hidden");
    readCardIndex.textContent = cardIndex + 1;
});

editBtn.addEventListener('click', function() {
    showCard.classList.remove("hidden");
    readCard.classList.add("hidden");
});


/* Timer */

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


/* Timer Minimized */

const timerMinimizeBtn = document.querySelector('.fa-window-minimize');
const timerMinimized = document.querySelector('.timerMinimized');
const timerContainer = document.querySelector('.timerContainer');

timerMinimizeBtn.addEventListener('click', function() {
    timerContainer.classList.add("hidden");
    timerMinimized.classList.remove("hidden");
});

timerMinimized.addEventListener('click', function() {
    timerContainer.classList.remove("hidden");
    timerMinimized.classList.add("hidden");
});


/* Sort Decks */

deckSort.addEventListener('change', function() {
    SaveStringLocalStorage('sortOption', deckSort.value);
    SortDecks();
});

function SortDecks() {
    if (!decks) return;

    const loadSortOption = LoadStringLocalStorage('sortOption', 'timeAddedAsc');

    deckSort.value = loadSortOption;
    switch (loadSortOption) {
        case 'timeAddedAsc':
            decks.sort((a, b) => new Date(a.timeAdded) - new Date(b.timeAdded));
            break;
        case 'timeAddedDesc':
            decks.sort((a, b) => new Date(b.timeAdded) - new Date(a.timeAdded));
            break
        case 'nameAsc':
            decks.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'nameDesc':
            decks.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'lastAccessedAsc':
            decks.sort((a, b) => new Date(a.lastAccessed) - new Date(b.lastAccessed));
            break;
        case 'lastAccessedDesc':
            decks.sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed));
            break;
    }

    menu.innerHTML = '';
    decks.forEach((deck) => {
        AddDeck(deck);
    });
}


/* Manage Decks */

const deckEditBtn = document.querySelector('.deckEditBtn');
const editDeckContainer = document.querySelector('.editDeckContainer');
const editDeck = document.querySelector('.editDeck');
const closeEditDeck = document.querySelector('.closeEditDeck');

deckEditBtn.addEventListener('click', function() {
    editDeckContainer.classList.remove("hidden");

    document.body.style.overflow = 'hidden';
    editDeckContainer.scrollTop = 0;

    RenderDecksInManage();
});

closeEditDeck.addEventListener('click', function() {
    editDeckContainer.classList.add("hidden");
    document.body.style.overflow = 'auto';

    menu.innerHTML = '';
    decks.forEach((deck) => {
        AddDeck(deck);
    });
});

editDeck.addEventListener('click', async function(e) {
    const deckItem = e.target.closest('.editDeckItem');
    if (!deckItem) return;

    const deckID_or_name = deckItem.dataset.id;
    const inputElement = deckItem.querySelector('.editDeckInput');

    const currentDeck = decks.find((deck) => 
        (deck.id && deck.id == deckID_or_name) || (deck.name === deckID_or_name)
    );
    const deckIdx = decks.indexOf(currentDeck);


    if (e.target.classList.contains('editDeckNameBtn')) {
        // Enter edit
        if (inputElement.readOnly) {
            inputElement.readOnly = false;
            inputElement.focus();
            inputElement.select();
            e.target.textContent = 'Save';

            document.querySelectorAll('.editDeckInput').forEach(input => {
                if (!input.readOnly && input !== inputElement) {
                    input.readOnly = true;
                    input.nextElementSibling.textContent = 'Edit';
                    input.value = decks[deckIdx].name; 
                }
            });
        } 
        // Save
        else {
            if (!inputElement.value) {
                alert('Deck name cannot be empty');
                return;
            }

            if (inputElement.value.length > 20) {
                alert('Deck name cannot exceed 20 characters');
                return;
            }

            const oldDeckName = decks[deckIdx].name;
            const newDeckName = inputElement.value;

            if (decks.some(deck => deck.name === inputElement.value) 
                && oldDeckName !== newDeckName) {
                alert('Deck already exists');
                return;
            }

            if (newDeckName === oldDeckName) {
                inputElement.readOnly = true;
                e.target.textContent = 'Edit';
                return;
            }

            ShowLoadingScreen();
            decks = await UpdateDeckName(deckID_or_name, newDeckName, decks, deckIdx);

            if (!currentDeck.id) {
                deckItem.dataset.id = newDeckName;
            }
            inputElement.readOnly = true;
            e.target.textContent = 'Edit';

            SortDecks();
            HideLoadingScreen();
        }
    } 
    else if (e.target.classList.contains('deleteDeckNameBtn')) {
        document.querySelectorAll('.editDeckInput').forEach(input => {
            if (!input.readOnly) {
                input.readOnly = true;
                input.nextElementSibling.textContent = 'Edit';
                input.value = decks[deckIdx].name; 
            }
        });

        confirm(`Are you sure you want to delete deck (${currentDeck.name})?`) 
            ? DeleteDeck(e.target) : null;
    }
});

function RenderDecksInManage() {
    editDeck.innerHTML = `
        <p class="manageDeckTitle">Manage Decks</p>
        <i class="fa-solid fa-xmark closeManageBtn"></i>
    `;
    
    decks.forEach((deck) => {
        const item = document.createElement('div');
        item.className = 'editDeckItem';
        item.dataset.id = deck.id || deck.name;

        const input = document.createElement('input');
        input.className = 'editDeckInput';
        input.value = deck.name;
        input.readOnly = true;

        const editBtn = document.createElement('button');
        editBtn.className = 'editDeckNameBtn';
        editBtn.textContent = 'Edit';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'deleteDeckNameBtn';
        deleteBtn.textContent = 'Delete';

        item.appendChild(input);
        item.appendChild(editBtn);
        item.appendChild(deleteBtn);
        editDeck.appendChild(item);
    });

    const closeManageBtn = document.querySelector('.closeManageBtn');
    closeManageBtn.addEventListener('click', function() {
        editDeckContainer.classList.add("hidden");
        document.body.style.overflow = 'auto';

        menu.innerHTML = '';
        decks.forEach((deck) => {
            AddDeck(deck);
        });
    });
}

const loginBtn = document.querySelector('.loginBtn');
loginBtn.addEventListener('click', function() {
    window.location.href = 'login.html';
})