// --- Data ---
const projects = [
	{
		id: 'project1',
		title: '프로젝트 1',
		sliderTitle: '포트폴리오 시스템',
		sliderImage: 'image/slide1.png', // Ensure this image exists
		altText: '포트폴리오 시스템 웹사이트 메인 화면'
	},
	{
		id: 'project2',
		title: '프로젝트 2',
		sliderTitle: '고객 포털 플랫폼',
		sliderImage: 'image/slide2.jpg', // Ensure this image exists
		altText: '고객 포털 플랫폼 대시보드 스크린샷'
	},
	{
		id: 'project3',
		title: '프로젝트 3',
		sliderTitle: '모바일 커머스 앱',
		sliderImage: 'image/slide3.jpg', // Ensure this image exists
		altText: '모바일 커머스 앱 상품 목록 화면'
	}
];

const contentPosts = [
	{
		imageSrc: 'image/thumb_resume1.jpg', // Ensure this image exists
		altText: '내부 관리 시스템 스크린샷',
		title: '내부 관리 시스템 구축',
		description: '사내 업무 효율화를 위한 CRUD 기반 웹앱 개발. React, Node.js, MongoDB 사용.',
		details: '<p>사내 직원들이 사용하는 내부 관리 시스템입니다. React의 컴포넌트 기반 구조와 Node.js의 비동기 처리 능력을 활용하여 효율적인 시스템을 구축했습니다.</p>'
	},
	{
		imageSrc: 'image/thumb_resume2.jpg', // Ensure this image exists
		altText: '리디자인된 고객 포털 메인',
		title: '고객 포털 리디자인',
		description: '사용자 경험 개선 중심의 프론트엔드 리디자인. Figma로 프로토타입 설계 후 Vue.js로 구현.',
		details: '<p>기존 고객 포털의 사용성을 분석하고 문제점을 도출하여 Figma로 개선된 프로토타입을 제작했습니다. 이후 Vue.js를 사용하여 인터랙티브하고 반응성 좋은 UI를 구현했습니다.</p>'
	},
	{
		imageSrc: 'image/thumb_resume3.jpg', // Ensure this image exists
		altText: '모바일 쇼핑 앱 결제 화면',
		title: '모바일 커머스 앱 개발',
		description: 'React Native 기반 쇼핑 앱 제작. 사용자 인증, 결제 연동 및 푸시 알림 기능 구현.',
		details: '<p>React Native를 이용하여 iOS와 Android 모두에서 동작하는 쇼핑 앱을 개발했습니다. 사용자 경험을 고려한 네비게이션 구조와 상태 관리(Context API 또는 Redux)에 중점을 두었습니다.</p>'
	},
	{
		imageSrc: 'image/thumb_resume4.jpg', // Ensure this image exists
		altText: '실시간 채팅 화면 예시',
		title: '실시간 채팅 시스템',
		description: 'Socket.IO를 활용한 실시간 채팅 플랫폼 구축. 그룹 채팅, 알림, 이모지 지원.',
		details: '<p>WebSocket 기반의 실시간 통신을 위해 Socket.IO 라이브러리를 사용했습니다. Node.js 백엔드와 연동하여 그룹 채팅방 생성, 메시지 전송/수신, 실시간 알림, 이모지 입력 등의 기능을 구현했습니다.</p>'
	}
];

// --- State Variables ---
let currentSlide = 0;
let slideItems = [];
let indicators = [];
let slideCount = 0;
let slidesContainer = null; // Will be selected after DOM ready
let sliderAutoPlayInterval = null;
const autoPlayDelay = 5000;

// --- Element Selectors (Global scope for convenience, selected after DOM ready/load) ---
let desktopNavEl = null;
let mobileNavLinksEl = null;
let mobileMenuToggleBtn = null;
let mobileNavContainer = null;
let slidesContainerEl = null;
let indicatorsContainerEl = null;
let contentPostSectionEl = null;
let modalEl = null;
let modalTitleEl = null;
let modalBodyEl = null;
let modalCloseBtn = null; // Specific selector for modal close
let overlayEl = null;
let contactForm = null;
let formStatus = null;
let darkToggleBtn = null;
let slidePrevBtn = null;
let slideNextBtn = null;

// --- Functions ---

/**
 * Fetches HTML content from a URL and injects it into a placeholder element.
 * @param {string} url - The URL of the HTML file to fetch.
 * @param {string} placeholderId - The ID of the element to inject the HTML into.
 * @returns {Promise<boolean>} - True if loading and injection succeeded, false otherwise.
 */
async function loadComponent(url, placeholderId) {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to load ${url}: ${response.statusText}`);
		}
		const text = await response.text();
		const placeholder = document.getElementById(placeholderId);
		if (placeholder) {
			placeholder.innerHTML = text;
			return true; // Indicate success
		} else {
			console.error(`Placeholder element #${placeholderId} not found.`);
			return false; // Indicate failure
		}
	} catch (error) {
		console.error(`Error loading component from ${url}:`, error);
		// Display error in placeholder?
		const placeholder = document.getElementById(placeholderId);
		if (placeholder) placeholder.innerHTML = `<p style="color: red; text-align: center;">Error loading content.</p>`;
		return false; // Indicate failure
	}
}


/**
 * Updates the visual state of slider indicators.
 */
function updateIndicators() {
	if (!indicators || indicators.length === 0 || indicators.length !== slideCount) return;
	indicators.forEach((indicator, idx) => {
		indicator.setAttribute('aria-selected', idx === currentSlide ? 'true' : 'false');
		indicator.setAttribute('tabindex', idx === currentSlide ? '0' : '-1');
		indicator.classList.toggle('active', idx === currentSlide);
	});
	slideItems.forEach((slide, idx) => {
		if (slide) { // Add check if slide exists
			slide.setAttribute('aria-hidden', idx !== currentSlide ? 'true' : 'false');
			// Only focusable when active (tabindex handled by aria-selected logic)
		}
	});
}

/**
 * Moves the slider to the next or previous slide.
 * @param {number} direction - 1 for next, -1 for previous.
 */
function moveSlide(direction) {
	if (!slidesContainerEl || slideCount <= 1) return;
	const newSlideIndex = (currentSlide + direction + slideCount) % slideCount;
	goToSlide(newSlideIndex);
}

/**
 * Jumps the slider directly to a specific slide index.
 * @param {number} index - The zero-based index of the slide to go to.
 */
function goToSlide(index) {
	if (!slidesContainerEl || index < 0 || index >= slideCount || slideCount <= 1 || index === currentSlide) return;
	currentSlide = index;
	slidesContainerEl.style.transform = `translateX(-${currentSlide * 100}%)`;
	updateIndicators();
}

function startSliderAutoPlay() {
	if (slideCount <= 1 || sliderAutoPlayInterval) return;
	sliderAutoPlayInterval = setInterval(() => moveSlide(1), autoPlayDelay);
}

function stopSliderAutoPlay() {
	clearInterval(sliderAutoPlayInterval);
	sliderAutoPlayInterval = null;
}

/**
 * Stops autoplay before manual interaction, then performs the action.
 * @param {Function} action - The slider function to call (e.g., moveSlide, goToSlide).
 * @param  {...any} args - Arguments for the action function.
 */
function handleSliderInteraction(action, ...args) {
	stopSliderAutoPlay();
	action(...args);
	// Optional: Restart autoplay after a delay if desired
	// setTimeout(startSliderAutoPlay, autoPlayDelay * 2);
}

/**
 * Toggles between light and dark mode themes.
 */
function toggleDarkMode() {
	const body = document.body;
	const isDarkMode = !body.classList.contains('dark-mode');
	body.classList.toggle('dark-mode');
	localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
	if (darkToggleBtn) {
		darkToggleBtn.textContent = isDarkMode ? '라이트 모드' : '다크 모드';
		darkToggleBtn.setAttribute('aria-label', isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환');
	}
}

/**
 * Applies the theme (dark/light) based on localStorage or system preference.
 */
function applySavedTheme() {
	const savedTheme = localStorage.getItem('theme');
	const body = document.body;
	const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
	let currentThemeIsDark = false;
	if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
		body.classList.add('dark-mode');
		currentThemeIsDark = true;
	} else {
		body.classList.remove('dark-mode');
		currentThemeIsDark = false;
	}
	if (darkToggleBtn) { // Ensure button exists
		darkToggleBtn.textContent = currentThemeIsDark ? '라이트 모드' : '다크 모드';
		darkToggleBtn.setAttribute('aria-label', currentThemeIsDark ? '라이트 모드로 전환' : '다크 모드로 전환');
	}
}

/**
 * Toggles the visibility of the mobile navigation menu.
 */
function toggleMobileMenu() {
	// Ensure elements are selected before toggling
	if (!mobileMenuToggleBtn || !mobileNavContainer) {
		console.error("Mobile menu elements not found.");
		return;
	}
	const isOpening = !document.body.classList.contains('menu-open');
	document.body.classList.toggle('menu-open');
	mobileMenuToggleBtn.setAttribute('aria-expanded', isOpening ? 'true' : 'false');
	mobileNavContainer.setAttribute('aria-hidden', isOpening ? 'false' : 'true');

	if (isOpening) {
		// Focus the first focusable element in the mobile nav
		const firstFocusableElement = mobileNavContainer.querySelector('a, button');
		firstFocusableElement?.focus();
	} else {
		// Return focus to the toggle button when closing
		mobileMenuToggleBtn.focus();
	}
}

/**
 * Opens the project detail modal.
 * @param {string} title - The title for the modal.
 * @param {string} details - HTML content for the modal body.
 */
function openModal(title, details) {
	if (!modalEl || !modalTitleEl || !modalBodyEl || !overlayEl || !modalCloseBtn) return;
	modalTitleEl.textContent = title;
	modalBodyEl.innerHTML = details;
	modalEl.classList.add('is-open');
	modalEl.setAttribute('aria-hidden', 'false');
	document.body.classList.add('modal-open');
	overlayEl.style.zIndex = '1040'; // Ensure overlay is above other content but below modal
	modalCloseBtn.focus(); // Focus the close button for accessibility
	stopSliderAutoPlay(); // Stop slider when modal is open
}

/**
 * Closes the project detail modal.
 */
function closeModal() {
	if (!modalEl || !overlayEl) return;
	modalEl.classList.remove('is-open');
	modalEl.setAttribute('aria-hidden', 'true');
	document.body.classList.remove('modal-open');
	overlayEl.style.zIndex = '99'; // Reset overlay z-index
	// Optional: Return focus to the element that opened the modal if tracked
	startSliderAutoPlay(); // Restart slider potentially
}

/**
 * Initializes Intersection Observer for scroll fade-in effects.
 */
function initializeScrollFadeIn() {
	const scrollFadeInElements = document.querySelectorAll('.js-scroll-fade-in');
	if (!('IntersectionObserver' in window) || !scrollFadeInElements.length) {
		// Fallback for browsers without IntersectionObserver or if no elements found
		console.warn("IntersectionObserver not supported or no elements found. Showing all elements.");
		scrollFadeInElements.forEach(el => {
			el.style.opacity = 1;
			el.style.transform = 'translateY(0)'; // Ensure transform is reset
			el.classList.add('is-visible'); // Add class for consistency if needed elsewhere
		});
		return;
	}
	const observerOptions = {root: null, rootMargin: '0px', threshold: 0.1};
	const observerCallback = (entries, observer) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				entry.target.classList.add('is-visible');
				observer.unobserve(entry.target); // Stop observing once visible
			}
		});
	};
	const scrollObserver = new IntersectionObserver(observerCallback, observerOptions);
	scrollFadeInElements.forEach(el => scrollObserver.observe(el));
}

/**
 * Generates navigation links in both desktop and mobile menus based on project data.
 * Requires header to be loaded first.
 * @param {Array} projectData - Array of project objects.
 */
function generateNavigationLinks(projectData) {
	// Select nav elements *after* header is potentially loaded
	desktopNavEl = document.querySelector('#header-placeholder header nav#desktopNav');
	mobileNavLinksEl = document.querySelector('#header-placeholder header #mobileNavLinks');

	if (!desktopNavEl || !mobileNavLinksEl) {
		console.error("Navigation containers not found. Header might not be loaded yet.");
		return;
	}

	desktopNavEl.innerHTML = ''; // Clear existing links
	mobileNavLinksEl.innerHTML = ''; // Clear existing links

	projectData.forEach((project) => {
		const anchorHref = `#${project.id}`; // Link to section IDs

		// Desktop Nav Link
		const desktopLink = document.createElement('a');
		desktopLink.href = anchorHref;
		desktopLink.textContent = project.title;
		desktopNavEl.appendChild(desktopLink);

		// Mobile Nav Link
		const mobileLink = document.createElement('a');
		mobileLink.href = anchorHref;
		mobileLink.textContent = project.title;
		// Close menu on mobile link click
		mobileLink.addEventListener('click', () => {
			if (document.body.classList.contains('menu-open')) {
				toggleMobileMenu();
			}
		});
		mobileNavLinksEl.appendChild(mobileLink);
	});
}


/**
 * Generates slider slides and indicators based on project data.
 * @param {Array} projectData - Array of project objects.
 */
function generateSliderContent(projectData) {
	slidesContainerEl = document.getElementById('slidesContainer');
	indicatorsContainerEl = document.getElementById('indicators');
	slidePrevBtn = document.querySelector('.slider .slide-btn.prev'); // Select slider buttons
	slideNextBtn = document.querySelector('.slider .slide-btn.next');


	if (!slidesContainerEl || !indicatorsContainerEl || !slidePrevBtn || !slideNextBtn) {
		console.error("Slider containers or buttons not found.");
		return; // Exit if essential elements are missing
	}

	slidesContainerEl.innerHTML = ''; // Clear existing slides
	indicatorsContainerEl.innerHTML = ''; // Clear existing indicators
	slideItems = []; // Reset slide items array
	indicators = []; // Reset indicators array

	projectData.forEach((project, index) => {
		// Create Slide Item
		const slideItem = document.createElement('div');
		slideItem.id = `slide-${project.id}`;
		slideItem.classList.add('slide-item');
		slideItem.setAttribute('role', 'group'); // Changed from tabpanel to group for semantics
		slideItem.setAttribute('aria-roledescription', 'slide');
		slideItem.setAttribute('aria-label', `${index + 1} / ${projectData.length}`);
		slideItem.setAttribute('aria-hidden', index !== 0 ? 'true' : 'false');

		const img = document.createElement('img');
		img.src = project.sliderImage;
		img.alt = project.altText;
		img.loading = 'lazy'; // Good for performance
		img.decoding = 'async'; // Good for performance
		slideItem.appendChild(img);

		const caption = document.createElement('div');
		caption.classList.add('slide-caption');
		const captionTitle = document.createElement('h3');
		captionTitle.textContent = project.sliderTitle;
		caption.appendChild(captionTitle);

		// "Details" link - should link to the corresponding section on the page
		const detailsLink = document.createElement('a');
		detailsLink.href = `#${project.id}`; // Link to section ID
		detailsLink.textContent = '자세히 보기';
		detailsLink.classList.add('details-link');
		// You might want to add functionality if clicking this should do something else,
		// like opening a modal, but linking to section is standard.
		caption.appendChild(detailsLink);
		slideItem.appendChild(caption);

		slidesContainerEl.appendChild(slideItem);
		slideItems.push(slideItem); // Add to array

		// Create Indicator (only if more than one slide)
		if (projectData.length > 1) {
			const indicator = document.createElement('button'); // Use button for accessibility
			indicator.classList.add('indicator');
			indicator.setAttribute('role', 'tab'); // Use role="tab" for indicator lists
			indicator.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
			indicator.setAttribute('aria-controls', slideItem.id); // Controls the slide item panel
			indicator.setAttribute('aria-label', `프로젝트 ${index + 1} 보기: ${project.sliderTitle}`);
			indicator.setAttribute('tabindex', index === 0 ? '0' : '-1'); // Manage focus
			if (index === 0) indicator.classList.add('active');

			indicator.addEventListener('click', () => handleSliderInteraction(goToSlide, index));
			indicatorsContainerEl.appendChild(indicator);
			indicators.push(indicator); // Add to array
		}
	});

	slideCount = slideItems.length; // Update slide count

	// Show/Hide Slider Controls based on slide count
	const displayStyle = slideCount <= 1 ? 'none' : 'flex';
	slidePrevBtn.style.display = displayStyle;
	slideNextBtn.style.display = displayStyle;
	indicatorsContainerEl.style.display = slideCount <= 1 ? 'none' : 'flex'; // Also hide indicators if only 1 slide

	// Initialize slider state if slides exist
	if (slideCount > 0) {
		slidesContainerEl.style.transform = `translateX(0%)`; // Ensure initial position
		if (slideCount > 1) {
			updateIndicators(); // Set initial active indicator/slide state
		}
	}
}


/**
 * Generates content post elements in the designated section.
 * @param {Array} postData - Array of post objects.
 */
function generateContentPosts(postData) {
	contentPostSectionEl = document.getElementById('contentPostSection');
	if (!contentPostSectionEl) {
		console.error("Content post section not found.");
		return;
	}
	contentPostSectionEl.innerHTML = ''; // Clear existing posts

	postData.forEach(post => {
		// Use an anchor tag <a> if it should navigate, or button/div if it opens a modal
		const postContainer = document.createElement('div'); // Using div + role=button for modal action
		postContainer.classList.add('post', 'js-scroll-fade-in');
		postContainer.setAttribute('role', 'button'); // Indicate it's interactive
		postContainer.setAttribute('tabindex', '0'); // Make it focusable
		postContainer.setAttribute('aria-haspopup', 'dialog'); // Indicate it opens a dialog (modal)

		// Event listener to open modal
		postContainer.addEventListener('click', () => openModal(post.title, post.details));
		postContainer.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault(); // Prevent space bar scrolling
				openModal(post.title, post.details);
			}
		});

		const img = document.createElement('img');
		img.src = post.imageSrc;
		img.alt = post.altText;
		img.loading = 'lazy';
		img.decoding = 'async';
		postContainer.appendChild(img);

		const textDiv = document.createElement('div');
		textDiv.classList.add('post-text');
		const title = document.createElement('h3');
		title.textContent = post.title;
		textDiv.appendChild(title);
		const description = document.createElement('p');
		description.textContent = post.description;
		textDiv.appendChild(description);
		postContainer.appendChild(textDiv);

		contentPostSectionEl.appendChild(postContainer);
	});
}

/**
 * Handles the submission of the contact form using Fetch API.
 * @param {Event} event - The form submission event.
 */
async function handleFormSubmit(event) {
	event.preventDefault();
	const form = event.target;
	const data = new FormData(form);
	formStatus = document.getElementById('formStatus'); // Select status element here

	if (!formStatus) {
		console.error("Form status element not found.");
		return;
	}

	formStatus.textContent = '전송 중...';
	formStatus.style.color = 'var(--text-color)'; // Use CSS variable

	try {
		// Ensure form.action has a valid URL (replace placeholder in index.html)
		if (!form.action || form.action.includes('YOUR_FORMSPREE_ENDPOINT')) {
			throw new Error("Formspree endpoint is not configured in the form's action attribute.");
		}

		const response = await fetch(form.action, {
			method: form.method,
			body: data,
			headers: {'Accept': 'application/json'} // Formspree requirement
		});

		if (response.ok) {
			formStatus.textContent = '메시지가 성공적으로 전송되었습니다!';
			formStatus.style.color = 'green';
			form.reset(); // Clear the form
			setTimeout(() => {
				formStatus.textContent = '';
			}, 5000); // Clear status after 5s
		} else {
			// Try to parse error from Formspree response
			const responseData = await response.json();
			if (responseData && responseData.errors) {
				formStatus.textContent = responseData.errors.map(error => error.message).join(", ");
			} else {
				formStatus.textContent = '메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.';
			}
			formStatus.style.color = 'red';
		}
	} catch (error) {
		console.error("Form submission error:", error);
		formStatus.textContent = `메시지 전송 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`;
		formStatus.style.color = 'red';
	}
}

// --- Initialization Function ---

/**
 * Selects elements and attaches primary event listeners after the DOM is ready
 * and header/footer components are loaded.
 */
function initializePageFunctionality() {
	// Select elements that are always present or part of the main index.html structure
	modalEl = document.getElementById('projectModal');
	modalTitleEl = document.getElementById('modalTitle');
	modalBodyEl = document.getElementById('modalBody');
	modalCloseBtn = document.querySelector('#projectModal .modal-close-btn');
	overlayEl = document.getElementById('menuOverlay');
	contactForm = document.getElementById('contactForm');
	darkToggleBtn = document.querySelector('.dark-toggle');

	// Select elements within the loaded header
	mobileMenuToggleBtn = document.querySelector('#header-placeholder header .mobile-menu-toggle');
	mobileNavContainer = document.querySelector('#header-placeholder header #mobileNavContainer'); // Check if ID remains unique

	// Select slider buttons (already selected in generateSliderContent, re-selecting for safety)
	slidePrevBtn = document.querySelector('.slider .slide-btn.prev');
	slideNextBtn = document.querySelector('.slider .slide-btn.next');

	// --- Attach Event Listeners ---

	// Theme Toggle
	if (darkToggleBtn) {
		darkToggleBtn.addEventListener('click', toggleDarkMode);
	} else {
		console.warn("Dark toggle button not found.");
	}

	// Mobile Menu Toggle
	if (mobileMenuToggleBtn) {
		mobileMenuToggleBtn.addEventListener('click', toggleMobileMenu);
	} // Note: mobile menu links handled in generateNavigationLinks

	// Slider Buttons
	if (slidePrevBtn && slideNextBtn) {
		slidePrevBtn.addEventListener('click', () => handleSliderInteraction(moveSlide, -1));
		slideNextBtn.addEventListener('click', () => handleSliderInteraction(moveSlide, 1));
	} else if (slideCount > 1) { // Only warn if slider should have buttons
		console.warn("Slider buttons not found.");
	}


	// Modal Close Button
	if (modalCloseBtn) {
		modalCloseBtn.addEventListener('click', closeModal);
	} else {
		console.warn("Modal close button not found.");
	}


	// Overlay Click (for closing menu or modal)
	if (overlayEl) {
		overlayEl.addEventListener('click', () => {
			if (document.body.classList.contains('modal-open')) {
				closeModal();
			} else if (document.body.classList.contains('menu-open')) {
				toggleMobileMenu();
			}
		});
	} else {
		console.warn("Overlay element not found.");
	}


	// Contact Form Submission
	if (contactForm) {
		contactForm.addEventListener('submit', handleFormSubmit);
	} else {
		console.warn("Contact form not found.");
	}


	// Global Keydown Listener (Escape key)
	window.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') {
			if (document.body.classList.contains('modal-open')) {
				closeModal();
			} else if (document.body.classList.contains('menu-open')) {
				toggleMobileMenu();
			}
		}
	});

	// Slider Touch Events & Focus Management (only if multiple slides)
	if (slideCount > 1 && slidesContainerEl) {
		const sliderEl = document.querySelector('.slider'); // The main slider container
		if (sliderEl) {
			// Pause on hover/focus
			sliderEl.addEventListener('mouseenter', stopSliderAutoPlay);
			sliderEl.addEventListener('mouseleave', startSliderAutoPlay);
			sliderEl.addEventListener('focusin', stopSliderAutoPlay); // Pause when focusing inside slider
			sliderEl.addEventListener('focusout', startSliderAutoPlay); // Resume when focus leaves slider
		}

		// Basic Touch Swipe Detection
		let startX = 0;
		let isDragging = false;
		slidesContainerEl.addEventListener('touchstart', e => {
			stopSliderAutoPlay();
			startX = e.touches[0].clientX;
			isDragging = true;
		}, {passive: true}); // Passive for better scroll performance

		slidesContainerEl.addEventListener('touchmove', e => {
			if (!isDragging) return;
			// Optional: Add visual feedback during move if desired
		}, {passive: true});

		slidesContainerEl.addEventListener('touchend', e => {
			if (!isDragging) return;
			isDragging = false;
			const endX = e.changedTouches[0].clientX;
			const diff = endX - startX;
			const threshold = 50; // Minimum swipe distance

			if (diff > threshold) { // Swiped right (previous)
				handleSliderInteraction(moveSlide, -1);
			} else if (diff < -threshold) { // Swiped left (next)
				handleSliderInteraction(moveSlide, 1);
			}
			// Consider restarting autoplay after touch interaction if needed
			// setTimeout(startSliderAutoPlay, autoPlayDelay * 2);
		}, {passive: true});
	}

	// Update Footer Year and Date (needs footer loaded)
	const copyrightYearEl = document.getElementById('copyrightYear');
	const updateDateEl = document.getElementById('updateDate');
	if (copyrightYearEl) {
		copyrightYearEl.textContent = new Date().getFullYear();
	}
	if (updateDateEl) {
		// document.lastModified only works well for the main HTML file.
		// Use a fixed date or current date for simplicity in partials.
		updateDateEl.textContent = new Date().toLocaleDateString('ko-KR'); // Format as YYYY. MM. DD.
	}

	// Start Autoplay (if applicable)
	if (slideCount > 1) {
		startSliderAutoPlay();
	}

	// Initialize scroll effects AFTER content is potentially placed
	initializeScrollFadeIn();

	console.log("Page functionality initialized.");
}


// --- DOMContentLoaded Event Listener ---
document.addEventListener('DOMContentLoaded', async () => {
	console.log("DOM fully loaded and parsed.");

	// Apply theme immediately before content loads to prevent flash
	applySavedTheme();

	// Load Header and Footer concurrently
	const headerPromise = loadComponent('header.html', 'header-placeholder');
	const footerPromise = loadComponent('footer.html', 'footer-placeholder');

	// Wait for both header and footer to finish loading (or fail)
	const [headerLoaded, footerLoaded] = await Promise.all([headerPromise, footerPromise]);

	if (!headerLoaded) {
		console.error("Header failed to load. Some functionality might be broken.");
	}
	if (!footerLoaded) {
		console.error("Footer failed to load. Some functionality might be broken.");
	}

	// Generate dynamic content AFTER placeholders are potentially filled
	if (headerLoaded) {
		generateNavigationLinks(projects); // Generate nav links now that header exists
	}
	generateSliderContent(projects); // Generate slider content
	generateContentPosts(contentPosts); // Generate posts

	// Initialize all interactive components and event listeners
	initializePageFunctionality();

	// Fallback for scroll fade-in if elements were added dynamically after initial load
	// This ensures elements added by JS also get observed if they have the class.
	initializeScrollFadeIn();

});