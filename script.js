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
 * Fetches content from a URL. Handles both HTML and JSON.
 * @param {string} url - The URL of the resource to fetch.
 * @param {string} [type='html'] - The expected content type ('html' or 'json').
 * @returns {Promise<string|object|null>} - The fetched content (string for HTML, object for JSON) or null on error.
 */
async function fetchContent(url, type = 'html') {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
		}
		if (type === 'json') {
			return await response.json();
		} else {
			return await response.text();
		}
	} catch (error) {
		console.error(`Error loading content from ${url}:`, error);
		return null; // Indicate failure
	}
}

/**
 * Loads HTML component into a placeholder. Uses fetchContent.
 * @param {string} url - The URL of the HTML file.
 * @param {string} placeholderId - The ID of the placeholder element.
 * @returns {Promise<boolean>} - True on success, false on failure.
 */
async function loadComponent(url, placeholderId) {
	const htmlContent = await fetchContent(url, 'html');
	const placeholder = document.getElementById(placeholderId);

	if (placeholder) {
		if (htmlContent !== null) {
			placeholder.innerHTML = htmlContent;
			return true;
		} else {
			placeholder.innerHTML = `<p style="color: red; text-align: center;">Error loading content.</p>`;
			return false;
		}
	} else {
		console.error(`Placeholder element #${placeholderId} not found.`);
		return false;
	}
}


/**
 * Updates the visual state of slider indicators.
 */
function updateIndicators() {
	// (이 함수 내용은 변경 없음 - 기존 코드 유지)
	if (!indicators || indicators.length === 0 || indicators.length !== slideCount) return;
	indicators.forEach((indicator, idx) => {
		indicator.setAttribute('aria-selected', idx === currentSlide ? 'true' : 'false');
		indicator.setAttribute('tabindex', idx === currentSlide ? '0' : '-1');
		indicator.classList.toggle('active', idx === currentSlide);
	});
	slideItems.forEach((slide, idx) => {
		if (slide) {
			slide.setAttribute('aria-hidden', idx !== currentSlide ? 'true' : 'false');
		}
	});
}

/**
 * Moves the slider to the next or previous slide.
 */
function moveSlide(direction) {
	// (이 함수 내용은 변경 없음 - 기존 코드 유지)
	if (!slidesContainerEl || slideCount <= 1) return;
	const newSlideIndex = (currentSlide + direction + slideCount) % slideCount;
	goToSlide(newSlideIndex);
}

/**
 * Jumps the slider directly to a specific slide index.
 */
function goToSlide(index) {
	// (이 함수 내용은 변경 없음 - 기존 코드 유지)
	if (!slidesContainerEl || index < 0 || index >= slideCount || slideCount <= 1 || index === currentSlide) return;
	currentSlide = index;
	slidesContainerEl.style.transform = `translateX(-${currentSlide * 100}%)`;
	updateIndicators();
}

function startSliderAutoPlay() {
	// (이 함수 내용은 변경 없음 - 기존 코드 유지)
	if (slideCount <= 1 || sliderAutoPlayInterval) return;
	sliderAutoPlayInterval = setInterval(() => moveSlide(1), autoPlayDelay);
}

function stopSliderAutoPlay() {
	// (이 함수 내용은 변경 없음 - 기존 코드 유지)
	clearInterval(sliderAutoPlayInterval);
	sliderAutoPlayInterval = null;
}

/**
 * Stops autoplay before manual interaction, then performs the action.
 */
function handleSliderInteraction(action, ...args) {
	// (이 함수 내용은 변경 없음 - 기존 코드 유지)
	stopSliderAutoPlay();
	action(...args);
	// Optional: Restart autoplay after a delay if desired
	// setTimeout(startSliderAutoPlay, autoPlayDelay * 2);
}

/**
 * Toggles between light and dark mode themes.
 */
function toggleDarkMode() {
	// (이 함수 내용은 변경 없음 - 기존 코드 유지)
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
	// (이 함수 내용은 변경 없음 - 기존 코드 유지)
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
	} else {
		// If button isn't selected yet during initial load, try selecting again
		darkToggleBtn = document.querySelector('.dark-toggle');
		if (darkToggleBtn) {
			darkToggleBtn.textContent = currentThemeIsDark ? '라이트 모드' : '다크 모드';
			darkToggleBtn.setAttribute('aria-label', currentThemeIsDark ? '라이트 모드로 전환' : '다크 모드로 전환');
		}
	}
}

/**
 * Toggles the visibility of the mobile navigation menu.
 */
function toggleMobileMenu() {
	// (이 함수 내용은 변경 없음 - 기존 코드 유지)
	if (!mobileMenuToggleBtn || !mobileNavContainer) {
		console.error("Mobile menu elements not found.");
		return;
	}
	const isOpening = !document.body.classList.contains('menu-open');
	document.body.classList.toggle('menu-open');
	mobileMenuToggleBtn.setAttribute('aria-expanded', isOpening ? 'true' : 'false');
	mobileNavContainer.setAttribute('aria-hidden', isOpening ? 'false' : 'true');

	if (isOpening) {
		const firstFocusableElement = mobileNavContainer.querySelector('a, button');
		firstFocusableElement?.focus();
	} else {
		mobileMenuToggleBtn.focus();
	}
}

/**
 * Opens the project detail modal.
 */
function openModal(title, details) {
	// (이 함수 내용은 변경 없음 - 기존 코드 유지)
	if (!modalEl || !modalTitleEl || !modalBodyEl || !overlayEl || !modalCloseBtn) return;
	modalTitleEl.textContent = title;
	modalBodyEl.innerHTML = details;
	modalEl.classList.add('is-open');
	modalEl.setAttribute('aria-hidden', 'false');
	document.body.classList.add('modal-open');
	overlayEl.style.zIndex = '1040';
	modalCloseBtn.focus();
	stopSliderAutoPlay();
}

/**
 * Closes the project detail modal.
 */
function closeModal() {
	// (이 함수 내용은 변경 없음 - 기존 코드 유지)
	if (!modalEl || !overlayEl) return;
	modalEl.classList.remove('is-open');
	modalEl.setAttribute('aria-hidden', 'true');
	document.body.classList.remove('modal-open');
	overlayEl.style.zIndex = '99';
	startSliderAutoPlay();
}

/**
 * Initializes Intersection Observer for scroll fade-in effects.
 */
function initializeScrollFadeIn() {
	// (이 함수 내용은 변경 없음 - 기존 코드 유지)
	const scrollFadeInElements = document.querySelectorAll('.js-scroll-fade-in');
	if (!('IntersectionObserver' in window) || !scrollFadeInElements.length) {
		console.warn("IntersectionObserver not supported or no elements found. Showing all elements.");
		scrollFadeInElements.forEach(el => {
			el.style.opacity = 1;
			el.style.transform = 'translateY(0)';
			el.classList.add('is-visible');
		});
		return;
	}
	const observerOptions = {root: null, rootMargin: '0px', threshold: 0.1};
	const observerCallback = (entries, observer) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				entry.target.classList.add('is-visible');
				observer.unobserve(entry.target);
			}
		});
	};
	const scrollObserver = new IntersectionObserver(observerCallback, observerOptions);
	scrollFadeInElements.forEach(el => scrollObserver.observe(el));
}

/**
 * Generates navigation links in both desktop and mobile menus based on project data.
 * Requires header to be loaded first.
 * @param {Array} projectData - Array of project objects. **Now passed as argument.**
 */
function generateNavigationLinks(projectData) { // *** data is now passed in ***
	// (이 함수 내용은 변경 없음 - 기존 코드 유지, 단 projectData를 인자로 받음)
	desktopNavEl = document.querySelector('#header-placeholder header nav#desktopNav');
	mobileNavLinksEl = document.querySelector('#header-placeholder header #mobileNavLinks');

	if (!desktopNavEl || !mobileNavLinksEl) {
		console.error("Navigation containers not found. Header might not be loaded yet.");
		return;
	}
	if (!projectData || projectData.length === 0) {
		console.warn("No project data provided for navigation.");
		// Optionally add a default link or message
		// desktopNavEl.innerHTML = '<li>No projects</li>';
		// mobileNavLinksEl.innerHTML = '<li>No projects</li>';
		return;
	}

	desktopNavEl.innerHTML = '';
	mobileNavLinksEl.innerHTML = '';

	projectData.forEach((project) => {
		const anchorHref = `#${project.id}`;
		const desktopLink = document.createElement('a');
		desktopLink.href = anchorHref;
		desktopLink.textContent = project.title;
		desktopNavEl.appendChild(desktopLink);

		const mobileLink = document.createElement('a');
		mobileLink.href = anchorHref;
		mobileLink.textContent = project.title;
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
 * @param {Array} projectData - Array of project objects. **Now passed as argument.**
 */
function generateSliderContent(projectData) { // *** data is now passed in ***
	// (이 함수 내용은 변경 없음 - 기존 코드 유지, 단 projectData를 인자로 받음)
	slidesContainerEl = document.getElementById('slidesContainer');
	indicatorsContainerEl = document.getElementById('indicators');
	slidePrevBtn = document.querySelector('.slider .slide-btn.prev');
	slideNextBtn = document.querySelector('.slider .slide-btn.next');

	if (!slidesContainerEl || !indicatorsContainerEl || !slidePrevBtn || !slideNextBtn) {
		console.error("Slider containers or buttons not found.");
		return;
	}
	if (!projectData || projectData.length === 0) {
		console.warn("No project data provided for slider.");
		// Optionally hide the slider section or show a message
		const sliderSection = document.querySelector('.slider');
		if(sliderSection) sliderSection.style.display = 'none';
		return;
	}

	slidesContainerEl.innerHTML = '';
	indicatorsContainerEl.innerHTML = '';
	slideItems = [];
	indicators = [];

	projectData.forEach((project, index) => {
		const slideItem = document.createElement('div');
		slideItem.id = `slide-${project.id}`;
		slideItem.classList.add('slide-item');
		slideItem.setAttribute('role', 'group');
		slideItem.setAttribute('aria-roledescription', 'slide');
		slideItem.setAttribute('aria-label', `${index + 1} / ${projectData.length}`);
		slideItem.setAttribute('aria-hidden', index !== 0 ? 'true' : 'false');

		const img = document.createElement('img');
		img.src = project.sliderImage;
		img.alt = project.altText;
		img.loading = 'lazy';
		img.decoding = 'async';
		slideItem.appendChild(img);

		const caption = document.createElement('div');
		caption.classList.add('slide-caption');
		const captionTitle = document.createElement('h3');
		captionTitle.textContent = project.sliderTitle;
		caption.appendChild(captionTitle);

		const detailsLink = document.createElement('a');
		detailsLink.href = `#${project.id}`;
		detailsLink.textContent = '자세히 보기';
		detailsLink.classList.add('details-link');
		caption.appendChild(detailsLink);
		slideItem.appendChild(caption);

		slidesContainerEl.appendChild(slideItem);
		slideItems.push(slideItem);

		if (projectData.length > 1) {
			const indicator = document.createElement('button');
			indicator.classList.add('indicator');
			indicator.setAttribute('role', 'tab');
			indicator.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
			indicator.setAttribute('aria-controls', slideItem.id);
			indicator.setAttribute('aria-label', `프로젝트 ${index + 1} 보기: ${project.sliderTitle}`);
			indicator.setAttribute('tabindex', index === 0 ? '0' : '-1');
			if (index === 0) indicator.classList.add('active');

			indicator.addEventListener('click', () => handleSliderInteraction(goToSlide, index));
			indicatorsContainerEl.appendChild(indicator);
			indicators.push(indicator);
		}
	});

	slideCount = slideItems.length;

	const displayStyle = slideCount <= 1 ? 'none' : 'flex';
	slidePrevBtn.style.display = displayStyle;
	slideNextBtn.style.display = displayStyle;
	indicatorsContainerEl.style.display = slideCount <= 1 ? 'none' : 'flex';

	if (slideCount > 0) {
		slidesContainerEl.style.transform = `translateX(0%)`;
		if (slideCount > 1) {
			updateIndicators();
		}
	}
}


/**
 * Generates content post elements in the designated section.
 * @param {Array} postData - Array of post objects. **Now passed as argument.**
 */
function generateContentPosts(postData) { // *** data is now passed in ***
	// (이 함수 내용은 변경 없음 - 기존 코드 유지, 단 postData를 인자로 받음)
	contentPostSectionEl = document.getElementById('contentPostSection');
	if (!contentPostSectionEl) {
		console.error("Content post section not found.");
		return;
	}
	if (!postData || postData.length === 0) {
		console.warn("No content post data provided.");
		// Optionally hide the section or show a message
		// contentPostSectionEl.innerHTML = '<p>No posts available.</p>';
		return;
	}

	contentPostSectionEl.innerHTML = '';

	postData.forEach(post => {
		const postContainer = document.createElement('div');
		postContainer.classList.add('post', 'js-scroll-fade-in');
		postContainer.setAttribute('role', 'button');
		postContainer.setAttribute('tabindex', '0');
		postContainer.setAttribute('aria-haspopup', 'dialog');

		postContainer.addEventListener('click', () => openModal(post.title, post.details));
		postContainer.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
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
 */
async function handleFormSubmit(event) {
	// (이 함수 내용은 변경 없음 - 기존 코드 유지)
	event.preventDefault();
	const form = event.target;
	const data = new FormData(form);
	formStatus = document.getElementById('formStatus');

	if (!formStatus) {
		console.error("Form status element not found.");
		return;
	}

	formStatus.textContent = '전송 중...';
	formStatus.style.color = 'var(--text-color)';

	try {
		if (!form.action || form.action.includes('YOUR_FORMSPREE_ENDPOINT')) {
			throw new Error("Formspree endpoint is not configured in the form's action attribute.");
		}

		const response = await fetch(form.action, {
			method: form.method,
			body: data,
			headers: {'Accept': 'application/json'}
		});

		if (response.ok) {
			formStatus.textContent = '메시지가 성공적으로 전송되었습니다!';
			formStatus.style.color = 'green';
			form.reset();
			setTimeout(() => {
				formStatus.textContent = '';
			}, 5000);
		} else {
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
	// (이 함수 내용은 변경 없음 - 기존 코드 유지)
	modalEl = document.getElementById('projectModal');
	modalTitleEl = document.getElementById('modalTitle');
	modalBodyEl = document.getElementById('modalBody');
	modalCloseBtn = document.querySelector('#projectModal .modal-close-btn');
	overlayEl = document.getElementById('menuOverlay');
	contactForm = document.getElementById('contactForm');
	darkToggleBtn = document.querySelector('.dark-toggle'); // Re-select here after elements potentially loaded

	mobileMenuToggleBtn = document.querySelector('#header-placeholder header .mobile-menu-toggle');
	mobileNavContainer = document.querySelector('#header-placeholder header #mobileNavContainer');

	slidePrevBtn = document.querySelector('.slider .slide-btn.prev');
	slideNextBtn = document.querySelector('.slider .slide-btn.next');

	// --- Attach Event Listeners ---
	if (darkToggleBtn) {
		darkToggleBtn.addEventListener('click', toggleDarkMode);
	} else {
		console.warn("Dark toggle button not found during init.");
	}

	if (mobileMenuToggleBtn) {
		mobileMenuToggleBtn.addEventListener('click', toggleMobileMenu);
	}

	if (slidePrevBtn && slideNextBtn) {
		slidePrevBtn.addEventListener('click', () => handleSliderInteraction(moveSlide, -1));
		slideNextBtn.addEventListener('click', () => handleSliderInteraction(moveSlide, 1));
	} else if (slideCount > 1) {
		console.warn("Slider buttons not found during init.");
	}

	if (modalCloseBtn) {
		modalCloseBtn.addEventListener('click', closeModal);
	} else {
		console.warn("Modal close button not found during init.");
	}

	if (overlayEl) {
		overlayEl.addEventListener('click', () => {
			if (document.body.classList.contains('modal-open')) {
				closeModal();
			} else if (document.body.classList.contains('menu-open')) {
				toggleMobileMenu();
			}
		});
	} else {
		console.warn("Overlay element not found during init.");
	}

	if (contactForm) {
		contactForm.addEventListener('submit', handleFormSubmit);
	} else {
		console.warn("Contact form not found during init.");
	}

	window.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') {
			if (document.body.classList.contains('modal-open')) {
				closeModal();
			} else if (document.body.classList.contains('menu-open')) {
				toggleMobileMenu();
			}
		}
	});

	if (slideCount > 1 && slidesContainerEl) {
		const sliderEl = document.querySelector('.slider');
		if (sliderEl) {
			sliderEl.addEventListener('mouseenter', stopSliderAutoPlay);
			sliderEl.addEventListener('mouseleave', startSliderAutoPlay);
			sliderEl.addEventListener('focusin', stopSliderAutoPlay);
			sliderEl.addEventListener('focusout', startSliderAutoPlay);
		}

		let startX = 0;
		let isDragging = false;
		slidesContainerEl.addEventListener('touchstart', e => {
			stopSliderAutoPlay();
			startX = e.touches[0].clientX;
			isDragging = true;
		}, {passive: true});

		slidesContainerEl.addEventListener('touchmove', e => {
			if (!isDragging) return;
		}, {passive: true});

		slidesContainerEl.addEventListener('touchend', e => {
			if (!isDragging) return;
			isDragging = false;
			const endX = e.changedTouches[0].clientX;
			const diff = endX - startX;
			const threshold = 50;

			if (diff > threshold) {
				handleSliderInteraction(moveSlide, -1);
			} else if (diff < -threshold) {
				handleSliderInteraction(moveSlide, 1);
			}
		}, {passive: true});
	}

	const copyrightYearEl = document.getElementById('copyrightYear');
	const updateDateEl = document.getElementById('updateDate');
	if (copyrightYearEl) {
		copyrightYearEl.textContent = new Date().getFullYear();
	}
	if (updateDateEl) {
		updateDateEl.textContent = new Date().toLocaleDateString('ko-KR');
	}

	if (slideCount > 1) {
		startSliderAutoPlay();
	}

	// Initialize scroll effects AFTER potentially adding elements
	// Called separately after this function in DOMContentLoaded
	// initializeScrollFadeIn();

	console.log("Page functionality initialized.");
}


// --- DOMContentLoaded Event Listener ---
document.addEventListener('DOMContentLoaded', async () => {
	console.log("DOM fully loaded and parsed.");

	// Apply theme immediately
	applySavedTheme(); // Make sure darkToggleBtn is selected inside or called after init

	// Load data, header, and footer concurrently
	const dataPromise = fetchContent('data.json', 'json'); // Fetch data as JSON
	const headerPromise = loadComponent('_header.html', 'header-placeholder');
	const footerPromise = loadComponent('_footer.html', 'footer-placeholder');

	// Wait for all essential content to load
	try {
		// Wait for header and footer HTML loading AND data fetching
		const [siteData, headerLoaded, footerLoaded] = await Promise.all([dataPromise, headerPromise, footerPromise]);

		// Check if components loaded successfully
		if (!headerLoaded) console.error("Header failed to load. Some functionality might be broken.");
		if (!footerLoaded) console.error("Footer failed to load. Some functionality might be broken.");

		// Check if data loaded successfully
		if (siteData === null) {
			throw new Error("Failed to load site data (data.json). Cannot generate dynamic content.");
		}

		// Extract data (assuming siteData is the object { projects: [], contentPosts: [] })
		const projects = siteData.projects;
		const contentPosts = siteData.contentPosts;

		// Generate dynamic content *using the loaded data*
		if (headerLoaded) {
			generateNavigationLinks(projects); // Pass projects data
		}
		generateSliderContent(projects);     // Pass projects data
		generateContentPosts(contentPosts); // Pass contentPosts data

		// Initialize all interactive components and event listeners
		// This needs to run AFTER dynamic elements (like slider buttons, nav links) are created
		initializePageFunctionality();

		// Initialize scroll effects after everything else is set up
		initializeScrollFadeIn();

	} catch (error) {
		console.error("Error during page initialization:", error);
		// Optionally display a user-friendly error message on the page
		const body = document.body;
		body.innerHTML = `<p style="color: red; text-align: center; padding: 50px;">페이지를 로드하는 중 오류가 발생했습니다. 나중에 다시 시도해주세요.</p>`;
	}
});