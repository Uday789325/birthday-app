// Joke Generator using JokeAPI
const generateBtn = document.getElementById('generate-btn');
const shareBtn = document.getElementById('share-btn');
const jokeText = document.getElementById('joke-text');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');

let currentJoke = '';

// API endpoint - Using JokeAPI (https://jokeapi.dev/)
const JOKE_API_URL = 'https://v2.jokeapi.dev/joke/Any?type=single';

// Generate a random joke
async function generateJoke() {
    try {
        // Show loading state
        generateBtn.disabled = true;
        loadingDiv.classList.remove('hidden');
        errorDiv.classList.add('hidden');
        jokeText.textContent = '';

        // Fetch joke from API
        const response = await fetch(JOKE_API_URL);
        
        if (!response.ok) {
            throw new Error('Failed to fetch joke');
        }

        const data = await response.json();

        // Handle the response
        if (data.type === 'single') {
            currentJoke = data.joke;
        } else if (data.type === 'twopart') {
            currentJoke = `${data.setup} ... ${data.delivery}`;
        } else {
            throw new Error('Unexpected joke format');
        }

        // Display the joke with animation
        loadingDiv.classList.add('hidden');
        jokeText.textContent = currentJoke;
        jokeText.style.animation = 'none';
        setTimeout(() => {
            jokeText.style.animation = 'fadeIn 0.5s ease-out';
        }, 10);

    } catch (error) {
        loadingDiv.classList.add('hidden');
        errorDiv.classList.remove('hidden');
        errorDiv.textContent = `Error: ${error.message}. Please try again!`;
        jokeText.textContent = '';
    } finally {
        generateBtn.disabled = false;
    }
}

// Share joke functionality
function shareJoke() {
    if (!currentJoke) {
        alert('Generate a joke first!');
        return;
    }

    // Check if Web Share API is available
    if (navigator.share) {
        navigator.share({
            title: '🎂 Birthday Joke',
            text: currentJoke,
            url: window.location.href
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(currentJoke)
            .then(() => {
                alert('Joke copied to clipboard! 📋');
            })
            .catch(() => {
                alert('Failed to copy joke');
            });
    }
}

// Event listeners
generateBtn.addEventListener('click', generateJoke);
shareBtn.addEventListener('click', shareJoke);

// Generate a joke on page load
window.addEventListener('load', generateJoke);