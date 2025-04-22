// blog/script.js
// 포트폴리오 웹사이트의 주요 상호작용 및 동적 콘텐츠 로딩을 처리하는 스크립트

// --- 전역 상태 변수 ---
let currentSlide = 0;        // 현재 표시 중인 슬라이드 인덱스
let slideItems = [];         // 슬라이드 DOM 요소 배열
let indicators = [];         // 슬라이드 인디케이터 DOM 요소 배열
let slideCount = 0;          // 총 슬라이드 개수
let slidesContainer = null;  // 슬라이드들을 담는 컨테이너 요소 (DOM 로드 후 할당)
let sliderAutoPlayInterval = null; // 슬라이더 자동 재생 인터벌 ID
const autoPlayDelay = 5000;  // 슬라이더 자동 재생 간격 (5초)

// --- 전역 DOM 요소 참조 변수 (DOM 로드 또는 컴포넌트 로드 후 할당) ---
let desktopNavEl = null;         // 데스크탑 네비게이션 요소
let mobileNavLinksEl = null;     // 모바일 네비게이션 링크 컨테이너 요소
let mobileMenuToggleBtn = null;  // 모바일 메뉴 토글 버튼 요소
let mobileNavContainer = null;   // 모바일 네비게이션 컨테이너 요소
let slidesContainerEl = null;    // 슬라이더 컨테이너 요소
let indicatorsContainerEl = null;// 슬라이더 인디케이터 컨테이너 요소
let contentPostSectionEl = null; // 콘텐츠 포스트 섹션 요소
let modalEl = null;              // 모달 창 요소 (현재 미사용 가능성 높음)
let modalTitleEl = null;         // 모달 제목 요소
let modalBodyEl = null;          // 모달 본문 요소
let modalCloseBtn = null;        // 모달 닫기 버튼 요소
let overlayEl = null;            // 오버레이 요소 (모바일 메뉴 및 모달용)
let contactForm = null;          // 문의 폼 요소
let formStatus = null;           // 문의 폼 상태 메시지 표시 요소
let darkToggleBtn = null;        // 다크 모드 토글 버튼 요소
let slidePrevBtn = null;         // 슬라이더 이전 버튼 요소
let slideNextBtn = null;         // 슬라이더 다음 버튼 요소

// --- 함수 정의 ---

/**
 * 지정된 URL로부터 콘텐츠를 비동기적으로 가져옵니다. HTML 또는 JSON 형식을 지원합니다.
 * @param {string} url - 가져올 리소스의 URL
 * @param {string} [type='html'] - 예상 콘텐츠 유형 ('html' 또는 'json')
 * @returns {Promise<string|object|null>} - 성공 시 가져온 콘텐츠 (HTML 문자열 또는 JSON 객체), 실패 시 null
 */
async function fetchContent(url, type = 'html') {
	try {
		const response = await fetch(url); // fetch API를 사용하여 리소스 요청
		if (!response.ok) { // 응답 상태 코드가 200-299 범위가 아니면 오류 발생
			throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
		}
		// type에 따라 응답 처리
		if (type === 'json') {
			return await response.json(); // JSON으로 파싱하여 반환
		} else {
			return await response.text(); // 텍스트(HTML)로 반환
		}
	} catch (error) {
		console.error(`Error loading content from ${url}:`, error); // 콘솔에 오류 로깅
		return null; // 실패 시 null 반환
	}
}

/**
 * HTML 컴포넌트 파일 내용을 지정된 ID의 플레이스홀더 요소에 로드합니다.
 * @param {string} url - 로드할 HTML 파일의 URL
 * @param {string} placeholderId - 내용을 삽입할 요소의 ID
 * @returns {Promise<boolean>} - 성공 시 true, 실패 시 false
 */
async function loadComponent(url, placeholderId) {
	const htmlContent = await fetchContent(url, 'html'); // HTML 내용 가져오기
	const placeholder = document.getElementById(placeholderId); // 플레이스홀더 요소 선택

	if (placeholder) { // 플레이스홀더가 존재하는지 확인
		if (htmlContent !== null) { // HTML 내용을 성공적으로 가져왔는지 확인
			placeholder.innerHTML = htmlContent; // 플레이스홀더에 내용 삽입
			return true; // 성공 반환
		} else {
			// 로드 실패 시 오류 메시지 표시
			placeholder.innerHTML = `<p style="color: red; text-align: center;">Error loading component ${url}.</p>`;
			return false; // 실패 반환
		}
	} else {
		console.error(`Placeholder element #${placeholderId} not found.`); // 플레이스홀더 없음 오류 로깅
		return false; // 실패 반환
	}
}


/**
 * 슬라이더 인디케이터의 시각적 상태를 업데이트합니다. (활성/비활성)
 * 현재 슬라이드에 해당하는 인디케이터에 'active' 클래스와 ARIA 속성을 설정합니다.
 */
function updateIndicators() {
	// 인디케이터 배열이 유효한지, 슬라이드 개수와 맞는지 확인
	if (!indicators || indicators.length === 0 || indicators.length !== slideCount) return;

	indicators.forEach((indicator, idx) => {
		// 현재 슬라이드 인덱스와 일치하는지 여부에 따라 ARIA 속성 및 클래스 설정
		indicator.setAttribute('aria-selected', idx === currentSlide ? 'true' : 'false');
		indicator.setAttribute('tabindex', idx === currentSlide ? '0' : '-1'); // 현재 슬라이드 인디케이터만 탭 포커스 가능
		indicator.classList.toggle('active', idx === currentSlide); // 'active' 클래스 토글
	});

	// 슬라이드 아이템들의 aria-hidden 속성 업데이트 (현재 보이는 슬라이드 제외)
	if (slideItems && slideItems.length > 0) {
		slideItems.forEach((slide, idx) => {
			if (slide) { // 개별 슬라이드 요소가 존재하는지 확인
				slide.setAttribute('aria-hidden', idx !== currentSlide ? 'true' : 'false');
			}
		});
	}
}

/**
 * 슬라이더를 지정된 방향(다음 또는 이전)으로 이동시킵니다.
 * @param {number} direction - 이동 방향 (1: 다음, -1: 이전)
 */
function moveSlide(direction) {
	// 슬라이더 컨테이너가 없거나 슬라이드가 1개 이하면 이동하지 않음
	if (!slidesContainerEl || slideCount <= 1) return;
	// 새로운 슬라이드 인덱스 계산 (순환 구조)
	const newSlideIndex = (currentSlide + direction + slideCount) % slideCount;
	goToSlide(newSlideIndex); // 해당 인덱스로 이동
}

/**
 * 슬라이더를 지정된 인덱스의 슬라이드로 직접 이동시킵니다.
 * @param {number} index - 이동할 슬라이드의 인덱스
 */
function goToSlide(index) {
	// 슬라이더 컨테이너가 없거나, 인덱스가 유효 범위를 벗어나거나, 슬라이드가 1개 이하이거나, 현재 슬라이드와 같으면 이동하지 않음
	if (!slidesContainerEl || index < 0 || index >= slideCount || slideCount <= 1 || index === currentSlide) return;

	currentSlide = index; // 현재 슬라이드 인덱스 업데이트
	// CSS transform을 사용하여 슬라이드 이동 효과 적용
	slidesContainerEl.style.transform = `translateX(-${currentSlide * 100}%)`;
	updateIndicators(); // 인디케이터 상태 업데이트
}

/**
 * 슬라이더 자동 재생을 시작합니다.
 * 슬라이드가 1개 이하이거나, 이미 자동 재생 중이거나, 슬라이더 컨테이너가 없으면 시작하지 않습니다.
 */
function startSliderAutoPlay() {
	if (slideCount <= 1 || sliderAutoPlayInterval || !slidesContainerEl) return;
	// 설정된 간격(autoPlayDelay)마다 moveSlide(1) (다음 슬라이드) 호출
	sliderAutoPlayInterval = setInterval(() => moveSlide(1), autoPlayDelay);
}

/**
 * 슬라이더 자동 재생을 중지합니다.
 */
function stopSliderAutoPlay() {
	clearInterval(sliderAutoPlayInterval); // setInterval 중지
	sliderAutoPlayInterval = null; // 인터벌 ID 초기화
}

/**
 * 사용자의 슬라이더 상호작용(클릭, 탭 등) 전에 자동 재생을 멈추고,
 * 상호작용 동작을 수행하는 래퍼 함수입니다.
 * @param {Function} action - 수행할 슬라이더 동작 함수 (e.g., goToSlide, moveSlide)
 * @param  {...any} args - action 함수에 전달할 인자들
 */
function handleSliderInteraction(action, ...args) {
	stopSliderAutoPlay(); // 자동 재생 중지
	action(...args); // 전달받은 동작 수행
	// 필요시: 일정 시간 후 자동 재생 다시 시작 (주석 처리됨)
	// setTimeout(startSliderAutoPlay, autoPlayDelay * 2);
}

/**
 * 라이트 모드와 다크 모드 테마를 토글합니다.
 * - body 요소에 'dark-mode' 클래스를 추가/제거합니다.
 * - 사용자의 테마 선택을 localStorage에 저장합니다.
 * - 다크 모드 토글 버튼의 텍스트와 ARIA 레이블을 업데이트합니다.
 */
function toggleDarkMode() {
	const body = document.body;
	if (!body) return; // body 요소 확인

	// 현재 다크 모드가 아닌 상태(!body.classList.contains('dark-mode'))이면 isDarkMode는 true
	const isDarkMode = !body.classList.contains('dark-mode');
	body.classList.toggle('dark-mode'); // 'dark-mode' 클래스 토글
	localStorage.setItem('theme', isDarkMode ? 'dark' : 'light'); // localStorage에 테마 저장

	// 다크 모드 토글 버튼 참조 확인 및 업데이트
	darkToggleBtn = darkToggleBtn || document.querySelector('.dark-toggle');
	if (darkToggleBtn) {
		darkToggleBtn.textContent = isDarkMode ? '라이트 모드' : '다크 모드'; // 버튼 텍스트 변경
		darkToggleBtn.setAttribute('aria-label', isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'); // 접근성 레이블 변경
	}
}

/**
 * 페이지 로드 시 저장된 테마(localStorage) 또는 시스템 설정을 적용합니다.
 * - localStorage에 저장된 테마 값을 확인합니다.
 * - 값이 없으면 시스템의 다크 모드 선호도(prefers-color-scheme)를 확인합니다.
 * - body 요소에 'dark-mode' 클래스를 적용하거나 제거합니다.
 * - 다크 모드 토글 버튼의 초기 상태를 설정합니다.
 */
function applySavedTheme() {
	const savedTheme = localStorage.getItem('theme'); // 저장된 테마 가져오기
	const body = document.body;
	if (!body) return;

	// 시스템 다크 모드 선호도 확인
	const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
	let currentThemeIsDark = false; // 현재 테마가 다크 모드인지 여부

	// 저장된 테마가 'dark'이거나, 저장된 테마가 없고 시스템이 다크 모드를 선호하면 다크 모드 적용
	if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
		body.classList.add('dark-mode');
		currentThemeIsDark = true;
	} else {
		body.classList.remove('dark-mode');
		currentThemeIsDark = false;
	}

	// 다크 모드 토글 버튼 참조 확인 및 초기 텍스트/레이블 설정
	darkToggleBtn = darkToggleBtn || document.querySelector('.dark-toggle');
	if (darkToggleBtn) {
		darkToggleBtn.textContent = currentThemeIsDark ? '라이트 모드' : '다크 모드';
		darkToggleBtn.setAttribute('aria-label', currentThemeIsDark ? '라이트 모드로 전환' : '다크 모드로 전환');
	}
}

/**
 * 모바일 네비게이션 메뉴의 표시 상태를 토글합니다.
 * - body에 'menu-open' 클래스를 토글합니다.
 * - 토글 버튼과 네비게이션 컨테이너의 ARIA 속성을 업데이트합니다.
 * - 오버레이를 표시/숨김 처리합니다. (zIndex는 CSS에서 관리)
 * - 메뉴가 열릴 때 첫 번째 포커스 가능한 요소로 포커스를 이동하고, 닫힐 때 토글 버튼으로 포커스를 복귀시킵니다.
 */
function toggleMobileMenu() {
	// 헤더 및 관련 요소 로드 및 선택 확인
	mobileMenuToggleBtn = mobileMenuToggleBtn || document.querySelector('#header-placeholder header .mobile-menu-toggle');
	mobileNavContainer = mobileNavContainer || document.querySelector('#header-placeholder header #mobileNavContainer');
	overlayEl = overlayEl || document.getElementById('menuOverlay'); // 오버레이 선택 확인

	if (!mobileMenuToggleBtn || !mobileNavContainer) {
		console.error("Mobile menu toggle button or container not found. Header might not be loaded or structured correctly.");
		return; // 필수 요소 없으면 중단
	}

	const isOpening = !document.body.classList.contains('menu-open'); // 메뉴가 열리는 상태인지 확인

	document.body.classList.toggle('menu-open'); // body 클래스 토글 (CSS에서 오버레이 표시/숨김 및 스크롤 방지 제어)
	mobileMenuToggleBtn.setAttribute('aria-expanded', isOpening ? 'true' : 'false'); // 토글 버튼 접근성 속성 업데이트
	mobileNavContainer.setAttribute('aria-hidden', isOpening ? 'false' : 'true'); // 메뉴 컨테이너 접근성 속성 업데이트

	// 오버레이 표시/숨김 및 z-index는 CSS에서 body.menu-open 클래스를 기반으로 처리됩니다.
	// JavaScript에서 직접 스타일을 변경할 필요가 없습니다.

	if (isOpening) {
		// 메뉴가 열릴 때: 첫 번째 링크나 버튼에 포커스
		const firstFocusableElement = mobileNavContainer.querySelector('a, button');
		firstFocusableElement?.focus(); // Optional chaining 사용
	} else {
		// 메뉴가 닫힐 때: 토글 버튼으로 포커스 복귀
		mobileMenuToggleBtn.focus();
	}
}


// --- 모달 관련 함수 (현재는 사용하지 않지만, 필요시 활성화 가능) ---
/**
 * 프로젝트 상세 정보를 표시하는 모달 창을 엽니다. (현재 사용되지 않을 수 있음)
 * @param {string} title - 모달 창의 제목
 * @param {string} details - 모달 본문에 표시될 HTML 내용
 */
function openModal(title, details) {
	// 모달 관련 요소 참조 확인
	modalEl = modalEl || document.getElementById('projectModal');
	modalTitleEl = modalTitleEl || document.getElementById('modalTitle');
	modalBodyEl = modalBodyEl || document.getElementById('modalBody');
	overlayEl = overlayEl || document.getElementById('menuOverlay');
	modalCloseBtn = modalCloseBtn || document.querySelector('#projectModal .modal-close-btn');

	// 필수 요소가 없으면 경고 표시 후 중단
	if (!modalEl || !modalTitleEl || !modalBodyEl || !overlayEl || !modalCloseBtn) {
		console.warn("Modal elements not found. Cannot open modal.");
		return;
	}

	// 모달 내용 설정
	modalTitleEl.textContent = title;
	modalBodyEl.innerHTML = details;

	// 모달 표시
	modalEl.classList.add('is-open'); // CSS에서 display: flex 등으로 보이게 함
	modalEl.setAttribute('aria-hidden', 'false'); // 접근성: 모달이 보임
	document.body.classList.add('modal-open'); // body 스크롤 방지 및 오버레이 표시용 클래스 추가
	overlayEl.style.zIndex = '1040'; // 모달 오버레이가 다른 오버레이(메뉴용)보다 위에 오도록 z-index 설정

	// 포커스 관리: 모달 닫기 버튼에 포커스
	modalCloseBtn.focus();
	stopSliderAutoPlay(); // 모달이 열리면 슬라이더 자동 재생 중지
}

/**
 * 열려 있는 프로젝트 상세 모달 창을 닫습니다. (현재 사용되지 않을 수 있음)
 */
function closeModal() {
	modalEl = modalEl || document.getElementById('projectModal');
	overlayEl = overlayEl || document.getElementById('menuOverlay');

	if (!modalEl || !overlayEl) return; // 모달 또는 오버레이 요소 없으면 중단

	// 모달 숨김 처리
	modalEl.classList.remove('is-open');
	modalEl.setAttribute('aria-hidden', 'true'); // 접근성: 모달이 숨겨짐
	document.body.classList.remove('modal-open'); // body 클래스 제거
	overlayEl.style.zIndex = ''; // 오버레이 z-index 초기화 (CSS 기본값 적용)

	// 필요시: 모달 닫힌 후 슬라이더 자동 재생 다시 시작
	// startSliderAutoPlay();
}
// --- 모달 함수 끝 ---


/**
 * 스크롤에 따른 요소 페이드인 효과를 위한 Intersection Observer를 초기화합니다.
 * - '.js-scroll-fade-in' 또는 '.scroll-fade-item' 클래스를 가진 요소를 감시합니다.
 * - 요소가 뷰포트에 일정 비율 이상 들어오면 'is-visible' 클래스를 추가하여 CSS 애니메이션을 트리거합니다.
 * - IntersectionObserver를 지원하지 않거나 대상 요소가 없으면 모든 대상 요소를 즉시 표시합니다.
 */
function initializeScrollFadeIn() {
	// 스크롤 효과를 적용할 모든 대상 요소를 선택합니다.
	// '.js-scroll-fade-in': 기존 섹션 등에 사용
	// '.scroll-fade-item': 프로젝트 상세 페이지의 동적 이미지 아이템 등에 사용
	const scrollFadeElements = document.querySelectorAll('.js-scroll-fade-in, .scroll-fade-item');

	// IntersectionObserver 지원 여부 및 대상 요소 존재 여부 확인
	if (!('IntersectionObserver' in window) || !scrollFadeElements || scrollFadeElements.length === 0) {
		console.warn("IntersectionObserver not supported or no elements for scroll effects found. Showing all elements.");
		// 지원하지 않거나 대상 요소가 없으면, 모든 요소를 즉시 보이도록 처리 (폴백)
		if (scrollFadeElements) {
			scrollFadeElements.forEach(el => {
				el.style.opacity = 1; // 투명도 1로 설정
				el.style.transform = 'translate(0, 0) scale(1)'; // 위치 및 크기 초기화
				el.classList.add('is-visible'); // CSS에서 참조할 수 있도록 클래스 추가
			});
		}
		return; // 함수 종료
	}

	// Intersection Observer 설정 옵션
	const observerOptions = {
		root: null, // 뷰포트를 기준으로 관찰
		rootMargin: '0px 0px -50px 0px', // 뷰포트 하단에서 50px 위 영역부터 감지 시작 (조정 가능)
		threshold: 0.1 // 요소가 10% 이상 보였을 때 콜백 실행 (조정 가능)
	};

	// Intersection Observer 콜백 함수: 요소가 뷰포트에 들어왔을 때 실행됨
	const observerCallback = (entries, observer) => {
		entries.forEach(entry => {
			// isIntersecting 속성으로 요소가 현재 뷰포트와 교차하는지 확인
			if (entry.isIntersecting) {
				entry.target.classList.add('is-visible'); // 'is-visible' 클래스 추가 (CSS 애니메이션 트리거)
				observer.unobserve(entry.target); // 한 번 효과가 적용된 요소는 더 이상 관찰하지 않음 (성능 최적화)
			}
		});
	};

	// Intersection Observer 인스턴스 생성
	const scrollObserver = new IntersectionObserver(observerCallback, observerOptions);

	// 각 대상 요소를 Observer에 등록하여 관찰 시작
	scrollFadeElements.forEach(el => {
		// 이미 'is-visible' 클래스가 있는 요소는 관찰하지 않음 (페이지 로드 시 이미 보이는 요소 처리)
		if (!el.classList.contains('is-visible')) {
			scrollObserver.observe(el);
		}
	});

	// 콘솔 로그: 초기화된 요소 개수 출력
	console.log(`Initialized/Updated scroll fade effects for ${scrollFadeElements.length} elements.`);
}


/**
 * 프로젝트 데이터를 기반으로 데스크탑 및 모바일 네비게이션 메뉴 링크를 생성합니다.
 * 각 링크는 해당 프로젝트의 상세 페이지(project-detail.html?id=...)로 연결됩니다.
 * @param {Array} projectData - 프로젝트 객체 배열 (data.json의 projects)
 */
function generateNavigationLinks(projectData) {
	// 네비게이션 컨테이너 요소 선택 (헤더 로드 후)
	desktopNavEl = document.querySelector('#header-placeholder header nav#desktopNav');
	mobileNavLinksEl = document.querySelector('#header-placeholder header #mobileNavLinks');

	// 네비게이션 컨테이너가 없으면 오류 로깅 후 중단 (헤더 로드 실패 등)
	if (!desktopNavEl || !mobileNavLinksEl) {
		console.error("Navigation containers (#desktopNav or #mobileNavLinks) not found within #header-placeholder. Header might have failed to load.");
		return;
	}
	// 프로젝트 데이터가 없거나 비어있으면 경고 로깅 후 중단
	if (!projectData || projectData.length === 0) {
		console.warn("No project data provided for navigation.");
		// 필요시: "프로젝트 없음" 메시지 표시
		// desktopNavEl.innerHTML = '<li>No projects</li>';
		// mobileNavLinksEl.innerHTML = '<li>No projects</li>';
		return;
	}

	// 기존 링크 삭제
	desktopNavEl.innerHTML = '';
	mobileNavLinksEl.innerHTML = '';

	// 각 프로젝트에 대해 링크 생성
	projectData.forEach((project) => {
		// 상세 페이지 URL 생성 (예: project-detail.html?id=project1)
		const detailPageUrl = `project-detail.html?id=${project.id}`;

		// 데스크탑 네비게이션 링크 생성
		const desktopLink = document.createElement('a');
		desktopLink.href = detailPageUrl;
		desktopLink.textContent = project.title || `Project ${project.id}`; // 프로젝트 제목 사용, 없으면 ID 사용
		desktopNavEl.appendChild(desktopLink);

		// 모바일 네비게이션 링크 생성
		const mobileLink = document.createElement('a');
		mobileLink.href = detailPageUrl;
		mobileLink.textContent = project.title || `Project ${project.id}`;
		mobileLink.addEventListener('click', () => {
			// 모바일 링크 클릭 시: 메뉴가 열려있으면 닫기
			if (document.body.classList.contains('menu-open')) {
				toggleMobileMenu();
			}
			// 페이지 이동은 a 태그의 기본 href 동작에 맡김
		});
		mobileNavLinksEl.appendChild(mobileLink);
	});
}


/**
 * 프로젝트 데이터를 기반으로 메인 페이지 슬라이더의 슬라이드와 인디케이터를 생성합니다.
 * 슬라이더 요소(.slider)가 현재 페이지에 존재할 경우에만 실행됩니다.
 * "자세히 보기" 링크는 해당 프로젝트의 상세 페이지로 연결됩니다.
 * @param {Array} projectData - 프로젝트 객체 배열 (data.json의 projects)
 */
function generateSliderContent(projectData) {
	// 현재 페이지에 슬라이더 요소(.slider)가 있는지 확인
	const sliderElement = document.querySelector('.slider');
	if (!sliderElement) {
		// 슬라이더 없으면 함수 종료 (콘솔 로그는 주석 처리하여 불필요한 메시지 방지)
		// console.log("Slider element not found on this page. Skipping slider generation.");
		return;
	}

	// 슬라이더 내부 요소 선택
	slidesContainerEl = sliderElement.querySelector('#slidesContainer');
	indicatorsContainerEl = sliderElement.querySelector('#indicators');
	slidePrevBtn = sliderElement.querySelector('.slide-btn.prev');
	slideNextBtn = sliderElement.querySelector('.slide-btn.next');

	// 슬라이더 내부 필수 요소(컨테이너, 버튼) 확인
	if (!slidesContainerEl || !indicatorsContainerEl || !slidePrevBtn || !slideNextBtn) {
		console.error("Slider inner containers (#slidesContainer, #indicators) or buttons (.slide-btn) not found within .slider.");
		// 필수 요소 없으면 슬라이더 섹션 숨김 처리
		sliderElement.style.display = 'none';
		return;
	}

	// 프로젝트 데이터 확인
	if (!projectData || projectData.length === 0) {
		console.warn("No project data provided for slider.");
		// 데이터 없으면 슬라이더 섹션 숨김 처리
		sliderElement.style.display = 'none';
		return;
	}

	// 기존 슬라이드 및 인디케이터 내용 초기화
	slidesContainerEl.innerHTML = '';
	indicatorsContainerEl.innerHTML = '';
	slideItems = []; // 슬라이드 요소 배열 초기화
	indicators = []; // 인디케이터 요소 배열 초기화

	// 각 프로젝트 데이터로 슬라이드와 인디케이터 생성
	projectData.forEach((project, index) => {
		// 1. 슬라이드 아이템 생성 (div.slide-item)
		const slideItem = document.createElement('div');
		slideItem.id = `slide-${project.id}`; // 고유 ID 설정
		slideItem.classList.add('slide-item');
		slideItem.setAttribute('role', 'group'); // ARIA 역할
		slideItem.setAttribute('aria-roledescription', 'slide'); // ARIA 역할 설명
		slideItem.setAttribute('aria-label', `${index + 1} / ${projectData.length}`); // 슬라이드 번호 레이블
		slideItem.setAttribute('aria-hidden', index !== 0 ? 'true' : 'false'); // 초기에는 첫 슬라이드만 보이도록 설정

		// 2. 슬라이드 이미지 생성 (img)
		const img = document.createElement('img');
		img.src = project.sliderImage || 'image/placeholder.png'; // 이미지 경로, 없으면 플레이스홀더
		img.alt = project.altText || `Slide ${index + 1}`; // 대체 텍스트
		img.loading = 'lazy'; // 이미지 지연 로딩
		img.decoding = 'async'; // 비동기 디코딩
		slideItem.appendChild(img);

		// 3. 슬라이드 캡션 생성 (div.slide-caption)
		const caption = document.createElement('div');
		caption.classList.add('slide-caption');
		const captionTitle = document.createElement('h3');
		captionTitle.textContent = project.sliderTitle || project.title; // 슬라이더 제목 또는 프로젝트 제목 사용
		caption.appendChild(captionTitle);

		// 4. "자세히 보기" 링크 생성 (a.details-link)
		const detailsLink = document.createElement('a');
		detailsLink.href = `project-detail.html?id=${project.id}`; // 상세 페이지 링크 설정
		detailsLink.textContent = '자세히 보기';
		detailsLink.classList.add('details-link');
		caption.appendChild(detailsLink);
		slideItem.appendChild(caption); // 캡션을 슬라이드 아이템에 추가

		slidesContainerEl.appendChild(slideItem); // 완성된 슬라이드 아이템을 컨테이너에 추가
		slideItems.push(slideItem); // 슬라이드 요소 배열에 추가

		// 5. 슬라이드 인디케이터 생성 (button.indicator) - 슬라이드가 2개 이상일 때만
		if (projectData.length > 1) {
			const indicator = document.createElement('button');
			indicator.classList.add('indicator');
			indicator.setAttribute('role', 'tab'); // ARIA 역할
			indicator.setAttribute('aria-selected', index === 0 ? 'true' : 'false'); // 초기 선택 상태
			indicator.setAttribute('aria-controls', slideItem.id); // 제어 대상 슬라이드 ID 연결
			indicator.setAttribute('aria-label', `프로젝트 ${index + 1} 보기: ${project.sliderTitle || project.title}`); // 레이블
			indicator.setAttribute('tabindex', index === 0 ? '0' : '-1'); // 초기 탭 포커스 설정
			if (index === 0) indicator.classList.add('active'); // 초기 활성 클래스

			// 인디케이터 클릭 시 해당 슬라이드로 이동 (자동 재생 중지 후 이동)
			indicator.addEventListener('click', () => handleSliderInteraction(goToSlide, index));
			indicatorsContainerEl.appendChild(indicator); // 인디케이터를 컨테이너에 추가
			indicators.push(indicator); // 인디케이터 요소 배열에 추가
		}
	});

	slideCount = slideItems.length; // 총 슬라이드 개수 업데이트

	// 슬라이드 개수에 따라 버튼 및 인디케이터 표시 여부 결정
	const displayStyle = slideCount <= 1 ? 'none' : 'flex'; // 1개 이하면 숨김, 아니면 flex
	slidePrevBtn.style.display = displayStyle;
	slideNextBtn.style.display = displayStyle;
	indicatorsContainerEl.style.display = slideCount <= 1 ? 'none' : 'flex';

	// 슬라이드가 존재하면 초기 위치 설정 및 인디케이터 업데이트
	if (slideCount > 0) {
		slidesContainerEl.style.transform = `translateX(0%)`; // 첫 슬라이드 위치로 초기화
		if (slideCount > 1) {
			updateIndicators(); // 인디케이터 상태 업데이트
		}
	}
}


/**
 * data.json의 contentPosts 데이터를 기반으로 추가 콘텐츠 포스트 요소를 생성합니다.
 * #contentPostSection 요소가 현재 페이지에 존재할 경우에만 실행됩니다.
 * 각 포스트는 클릭/키보드 입력 시 모달 창을 열도록 설정될 수 있습니다 (현재 모달 사용 안 함).
 * @param {Array} postData - 포스트 객체 배열 (data.json의 contentPosts)
 */
function generateContentPosts(postData) {
	// 콘텐츠 포스트를 표시할 섹션 요소 선택
	contentPostSectionEl = document.getElementById('contentPostSection');
	if (!contentPostSectionEl) {
		// 섹션 요소 없으면 함수 종료
		// console.log("Content post section (#contentPostSection) not found on this page. Skipping post generation.");
		return;
	}

	// 포스트 데이터 확인
	if (!postData || postData.length === 0) {
		console.warn("No content post data provided.");
		// 데이터 없으면 "게시물 없음" 메시지 표시 (선택적)
		contentPostSectionEl.innerHTML = '<p>게시물이 없습니다.</p>';
		return;
	}

	contentPostSectionEl.innerHTML = ''; // 기존 포스트 내용 초기화

	// 각 포스트 데이터로 HTML 요소 생성
	postData.forEach(post => {
		// 1. 포스트 컨테이너 생성 (div.post)
		const postContainer = document.createElement('div');
		postContainer.classList.add('post', 'js-scroll-fade-in'); // 스크롤 페이드인 효과 적용
		// --- 모달 사용 시 필요한 속성 및 이벤트 리스너 (현재 주석 처리) ---
		// postContainer.setAttribute('role', 'button'); // 버튼 역할
		// postContainer.setAttribute('tabindex', '0'); // 탭 포커스 가능
		// postContainer.setAttribute('aria-haspopup', 'dialog'); // 모달(dialog) 열림을 알림
		// postContainer.addEventListener('click', () => openModal(post.title, post.details)); // 클릭 시 모달 열기
		// postContainer.addEventListener('keydown', (e) => { // Enter 또는 Space 키 입력 시 모달 열기
		// 	if (e.key === 'Enter' || e.key === ' ') {
		// 		e.preventDefault();
		// 		openModal(post.title, post.details);
		// 	}
		// });
		// --- 모달 리스너 끝 ---

		// 2. 포스트 이미지 생성 (img)
		const img = document.createElement('img');
		img.src = post.imageSrc || 'image/placeholder.png'; // 이미지 경로, 없으면 플레이스홀더
		img.alt = post.altText || post.title; // 대체 텍스트
		img.loading = 'lazy'; // 지연 로딩
		img.decoding = 'async'; // 비동기 디코딩
		postContainer.appendChild(img);

		// 3. 포스트 텍스트 영역 생성 (div.post-text)
		const textDiv = document.createElement('div');
		textDiv.classList.add('post-text');
		const title = document.createElement('h3');
		title.textContent = post.title; // 포스트 제목
		textDiv.appendChild(title);
		const description = document.createElement('p');
		description.textContent = post.description; // 포스트 설명
		textDiv.appendChild(description);
		postContainer.appendChild(textDiv); // 텍스트 영역을 포스트 컨테이너에 추가

		contentPostSectionEl.appendChild(postContainer); // 완성된 포스트를 섹션에 추가
	});

	// 참고: 동적으로 추가된 포스트(.js-scroll-fade-in)에 대한 스크롤 효과는
	// initializeScrollFadeIn() 함수가 이후에 호출되면서 적용됩니다.
}


/**
 * 연락처 폼 제출을 비동기(Fetch API) 방식으로 처리합니다.
 * Formspree 엔드포인트로 데이터를 전송하고 결과를 사용자에게 표시합니다.
 * #contactForm 요소가 현재 페이지에 존재할 경우에만 실행됩니다.
 * @param {Event} event - 폼 제출 이벤트 객체
 */
async function handleFormSubmit(event) {
	event.preventDefault(); // 기본 폼 제출(페이지 새로고침) 방지

	const form = event.target; // 이벤트가 발생한 폼 요소
	if (!form) return; // 폼 요소 없으면 중단

	// 폼 상태 메시지 표시 요소 확인 및 선택
	formStatus = formStatus || document.getElementById('formStatus');
	if (!formStatus) {
		console.error("Form status element (#formStatus) not found.");
		return; // 상태 요소 없으면 중단
	}

	const data = new FormData(form); // 폼 데이터 생성

	// 전송 시작 메시지 표시
	formStatus.textContent = '전송 중...';
	formStatus.style.color = 'var(--text-color)'; // 메시지 색상 초기화

	try {
		// Formspree 엔드포인트가 form의 action 속성에 올바르게 설정되었는지 확인
		if (!form.action || !form.action.includes('formspree.io')) {
			throw new Error("Formspree endpoint is not configured in the form's action attribute or is invalid.");
		}

		// Fetch API를 사용하여 폼 데이터 전송
		const response = await fetch(form.action, {
			method: form.method, // 폼의 method (POST) 사용
			body: data,          // 폼 데이터 전송
			headers: {'Accept': 'application/json'} // Formspree가 JSON 응답을 보내도록 요청
		});

		if (response.ok) { // 전송 성공 시 (상태 코드 2xx)
			formStatus.textContent = '메시지가 성공적으로 전송되었습니다!';
			formStatus.style.color = 'green'; // 성공 메시지 색상
			form.reset(); // 폼 입력 내용 초기화
			setTimeout(() => { formStatus.textContent = ''; }, 5000); // 5초 후 상태 메시지 지우기
		} else { // 전송 실패 시
			let errorMessage = '메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.';
			try {
				// Formspree의 JSON 오류 응답 파싱 시도
				const responseData = await response.json();
				if (responseData && responseData.errors) {
					// 오류 메시지가 있다면 구체적인 내용 표시
					errorMessage = responseData.errors.map(error => error.message).join(", ");
				}
			} catch (jsonError) {
				// JSON 파싱 실패 시 기본 오류 메시지 사용
				console.error("Could not parse Formspree error response:", jsonError);
			}
			formStatus.textContent = errorMessage; // 오류 메시지 표시
			formStatus.style.color = 'red'; // 오류 메시지 색상
		}
	} catch (error) { // 네트워크 오류 등 예외 발생 시
		console.error("Form submission error:", error);
		formStatus.textContent = `메시지 전송 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`;
		formStatus.style.color = 'red';
	}
}

// --- 초기화 관련 함수 ---

/**
 * 페이지 기능 초기화: DOM 로드 및 컴포넌트 로드 후 실행됩니다.
 * - 공통 요소(다크 모드 토글, 오버레이, 모바일 메뉴 등)를 선택하고 이벤트 리스너를 연결합니다.
 * - 페이지별 요소(슬라이더, 모달, 문의 폼 등)의 존재 여부를 확인하고 초기화합니다.
 * - 요소가 없는 경우 경고를 기록하고 관련 기능 설정을 건너<0xEB><0xA9>니다.
 */
function initializePageFunctionality() {
	console.log("Initializing page functionality...");

	// --- 공통 요소 선택 ---
	// 페이지 어디에나 있을 수 있는 요소들을 먼저 선택 시도
	darkToggleBtn = document.querySelector('.dark-toggle');
	overlayEl = document.getElementById('menuOverlay');
	// 헤더는 비동기 로드되므로, 헤더 내부 요소는 헤더 로드 후 선택해야 함
	// 여기서는 일단 null로 두고, 헤더 로드 후 다시 선택 시도
	mobileMenuToggleBtn = document.querySelector('#header-placeholder header .mobile-menu-toggle');
	mobileNavContainer = document.querySelector('#header-placeholder header #mobileNavContainer');

	// --- 공통 요소 리스너 연결 ---
	// 다크 모드 토글 버튼
	if (darkToggleBtn) {
		darkToggleBtn.addEventListener('click', toggleDarkMode);
	} else {
		console.warn("Dark toggle button not found.");
	}

	// 모바일 메뉴 토글 버튼 (헤더 로드 후 확인)
	// 주의: 이 함수는 DOMContentLoaded 시점에 호출될 수 있으며,
	// 헤더 컴포넌트가 아직 로드되지 않았다면 mobileMenuToggleBtn 등은 null일 수 있습니다.
	// 따라서 toggleMobileMenu 함수 내부에서도 요소를 다시 확인하는 것이 안전합니다.
	if (mobileMenuToggleBtn && mobileNavContainer) {
		mobileMenuToggleBtn.addEventListener('click', toggleMobileMenu);
	} else {
		// 헤더 로드가 아직 안되었을 수 있으므로, 여기서의 경고는 주석 처리하거나 주의해서 사용
		// console.warn("Mobile menu toggle or container potentially not loaded yet.");
	}

	// 오버레이
	if (overlayEl) {
		overlayEl.addEventListener('click', () => {
			// 오버레이 클릭 시 열려있는 모달 또는 모바일 메뉴 닫기
			modalEl = modalEl || document.getElementById('projectModal'); // 필요시 모달 요소 선택
			// 모달이 열려있는 경우
			if (modalEl && document.body.classList.contains('modal-open')) {
				closeModal();
			}
			// 모바일 메뉴가 열려있는 경우
			else if (mobileNavContainer && document.body.classList.contains('menu-open')) {
				toggleMobileMenu();
			}
		});
	} else {
		console.warn("Overlay element not found.");
	}

	// --- 페이지별 요소 초기화 (Index 페이지 등) ---

	// 슬라이더 초기화 (슬라이더 요소가 존재할 때만)
	const sliderElement = document.querySelector('.slider');
	if (sliderElement) {
		console.log("Slider found, initializing slider functionality...");
		// 슬라이더 내부 요소 선택
		slidePrevBtn = sliderElement.querySelector('.slide-btn.prev');
		slideNextBtn = sliderElement.querySelector('.slide-btn.next');
		slidesContainerEl = sliderElement.querySelector('#slidesContainer'); // 터치 이벤트 등에 필요

		// 이전/다음 버튼 리스너 연결
		if (slidePrevBtn && slideNextBtn) {
			slidePrevBtn.addEventListener('click', () => handleSliderInteraction(moveSlide, -1));
			slideNextBtn.addEventListener('click', () => handleSliderInteraction(moveSlide, 1));

			// 슬라이드가 2개 이상이고 컨테이너가 있으면 자동 재생 및 터치 이벤트 리스너 추가
			if (slidesContainerEl && slideCount > 1) {
				// 마우스 호버/포커스 시 자동 재생 제어
				sliderElement.addEventListener('mouseenter', stopSliderAutoPlay);
				sliderElement.addEventListener('mouseleave', startSliderAutoPlay);
				sliderElement.addEventListener('focusin', stopSliderAutoPlay);    // 키보드 접근성
				sliderElement.addEventListener('focusout', startSliderAutoPlay);   // 키보드 접근성

				// --- 기본 터치 스와이프 (선택적 기능) ---
				let touchStartX = 0;
				let touchIsDragging = false;

				slidesContainerEl.addEventListener('touchstart', e => {
					if (slideCount <= 1) return; // 슬라이드 1개 이하면 무시
					stopSliderAutoPlay(); // 드래그 시작 시 자동 재생 중지
					touchStartX = e.touches[0].clientX; // 터치 시작 X 좌표 저장
					touchIsDragging = true;
				}, { passive: true }); // 스크롤 성능 향상을 위해 passive 설정

				slidesContainerEl.addEventListener('touchend', e => {
					if (!touchIsDragging || slideCount <= 1) return; // 드래그 중이 아니거나 슬라이드 1개 이하면 무시
					touchIsDragging = false;
					const touchEndX = e.changedTouches[0].clientX; // 터치 종료 X 좌표 저장
					const diffX = touchEndX - touchStartX; // X축 이동 거리 계산
					const threshold = 50; // 스와이프로 인식할 최소 이동 거리 (픽셀)

					if (diffX > threshold) { // 오른쪽으로 스와이프 (이전 슬라이드)
						handleSliderInteraction(moveSlide, -1);
					} else if (diffX < -threshold) { // 왼쪽으로 스와이프 (다음 슬라이드)
						handleSliderInteraction(moveSlide, 1);
					}
					// 필요시: 스와이프 후 일정 시간 뒤 자동 재생 재시작
					// setTimeout(startSliderAutoPlay, autoPlayDelay * 2);
				}, { passive: true });
				// --- 터치 스와이프 끝 ---
			}
		} else {
			console.warn("Slider buttons not found within .slider element.");
		}

		// 슬라이더 자동 재생 시작 (슬라이드가 2개 이상일 때)
		if (slideCount > 1) {
			startSliderAutoPlay();
		}

	} else {
		// 슬라이더 요소가 없는 페이지 (e.g., project-detail.html)
		// console.log("Slider not found on this page.");
	}

	// 모달 초기화 (모달 요소가 존재할 때만)
	modalEl = document.getElementById('projectModal');
	if (modalEl) {
		console.log("Modal found, initializing modal functionality...");
		modalCloseBtn = modalEl.querySelector('.modal-close-btn'); // 닫기 버튼
		modalTitleEl = modalEl.querySelector('#modalTitle');     // 제목 요소
		modalBodyEl = modalEl.querySelector('#modalBody');       // 본문 요소

		if (modalCloseBtn) {
			modalCloseBtn.addEventListener('click', closeModal); // 닫기 버튼 클릭 리스너
		} else {
			console.warn("Modal close button not found inside #projectModal.");
		}
		// 모달 열기 리스너는 generateContentPosts 함수 내에서 각 포스트에 연결됩니다.
	} else {
		// 모달 요소가 없는 페이지
		// console.log("Modal not found on this page.");
	}

	// 문의 폼 초기화 (폼 요소가 존재할 때만)
	contactForm = document.getElementById('contactForm');
	if (contactForm) {
		console.log("Contact form found, initializing form submission handler...");
		formStatus = document.getElementById('formStatus'); // 상태 메시지 요소 선택
		if (!formStatus){
			console.warn("Form status element (#formStatus) not found. Submission status messages will not be displayed.");
		}
		contactForm.addEventListener('submit', handleFormSubmit); // 폼 제출 이벤트 리스너 연결
	} else {
		// 문의 폼이 없는 페이지
		// console.log("Contact form not found on this page.");
	}

	// --- 전역 키보드 이벤트 리스너 ---
	window.addEventListener('keydown', (event) => {
		// Escape 키를 눌렀을 때
		if (event.key === 'Escape') {
			modalEl = modalEl || document.getElementById('projectModal'); // 모달 요소 확인
			// 열려있는 모달 닫기
			if (modalEl && document.body.classList.contains('modal-open')) {
				closeModal();
			}
			// 열려있는 모바일 메뉴 닫기
			else if (mobileNavContainer && document.body.classList.contains('menu-open')) {
				toggleMobileMenu();
			}
		}
	});


	// --- 푸터 날짜 업데이트 (푸터 로드 후 실행 보장 필요) ---
	// DOMContentLoaded 시점에는 푸터가 아직 로드되지 않았을 수 있으므로,
	// 푸터 로드 완료 후 호출되거나, 여기서 요소 존재 여부를 확인하고 업데이트
	try {
		const copyrightYearEl = document.getElementById('copyrightYear');
		const updateDateEl = document.getElementById('updateDate');
		if (copyrightYearEl) {
			copyrightYearEl.textContent = new Date().getFullYear(); // 현재 연도 설정
		}
		if (updateDateEl) {
			// 한국 시간 형식으로 날짜 표시
			updateDateEl.textContent = new Date().toLocaleDateString('ko-KR', {
				year: 'numeric', month: 'long', day: 'numeric'
			});
		}
	} catch (e) {
		// 푸터 요소가 없거나 다른 오류 발생 시 경고
		console.warn("Could not update footer dates (may occur if footer hasn't loaded yet):", e);
	}


	console.log("Page functionality initialization complete.");
}


// --- 페이지 로드 완료 시 실행될 메인 로직 ---
document.addEventListener('DOMContentLoaded', async () => {
	console.log("DOM fully loaded and parsed.");

	// 1. 테마 적용 (외부 데이터나 컴포넌트 로드와 독립적)
	applySavedTheme();

	// 2. 데이터(data.json), 헤더(_header.html), 푸터(_footer.html) 비동기 병렬 로딩 시작
	const dataPromise = fetchContent('data.json', 'json');
	const headerPromise = loadComponent('_header.html', 'header-placeholder');
	const footerPromise = loadComponent('_footer.html', 'footer-placeholder');

	// 3. 모든 필수 콘텐츠 로딩 완료 기다리기
	try {
		// Promise.all을 사용하여 모든 비동기 작업이 끝날 때까지 대기
		const [siteData, headerLoaded, footerLoaded] = await Promise.all([dataPromise, headerPromise, footerPromise]);

		// 헤더/푸터 로드 성공 여부 확인 (오류 시 경고)
		if (!headerLoaded) console.error("Header component (_header.html) failed to load. Navigation might be broken.");
		if (!footerLoaded) console.error("Footer component (_footer.html) failed to load.");

		// 데이터 로드 성공 여부 확인 (필수 데이터이므로 실패 시 오류 발생)
		if (siteData === null) {
			throw new Error("Failed to load site data (data.json). Cannot generate dynamic content.");
		}

		// 로드된 데이터 추출 (데이터 구조 예상 및 폴백 처리)
		const projects = siteData.projects || [];         // 프로젝트 데이터 (없으면 빈 배열)
		const contentPosts = siteData.contentPosts || []; // 콘텐츠 포스트 데이터 (없으면 빈 배열)

		// --- 동적 콘텐츠 생성 (데이터 및 컴포넌트 로드 완료 후) ---
		// 헤더가 성공적으로 로드되었을 때만 네비게이션 링크 생성
		if (headerLoaded) {
			generateNavigationLinks(projects);
		}
		// 슬라이더 및 콘텐츠 포스트 생성 (각 함수 내부에서 관련 요소 존재 여부 확인)
		generateSliderContent(projects);
		generateContentPosts(contentPosts);

		// 4. 모든 상호작용 컴포넌트 및 이벤트 리스너 초기화
		// 이 시점에는 헤더/푸터 및 동적 콘텐츠(슬라이더, 포스트)가 DOM에 추가되었을 수 있음
		initializePageFunctionality();

		// 5. 스크롤 페이드인 효과 초기화 (모든 요소가 준비된 후 마지막에 실행)
		// 페이지 초기 로드 시 보이는 요소들에 대한 효과 적용 시작
		initializeScrollFadeIn();

	} catch (error) {
		// 데이터 로딩 실패 등 치명적 오류 발생 시 처리
		console.error("Critical error during page initialization:", error);
		// 사용자에게 오류 메시지 표시
		const body = document.body || document.createElement('body'); // body 요소 확보
		// 기존 내용 지우고 오류 메시지 삽입
		body.innerHTML = `<div style="color: red; text-align: center; padding: 50px; font-family: sans-serif;">
                            <h1>페이지 로딩 오류</h1>
                            <p>페이지를 표시하는 데 필요한 데이터를 불러오지 못했습니다.</p>
                            <p>나중에 다시 시도해주시기 바랍니다.</p>
                            <p style="font-size: 0.8em; color: #555;">오류: ${error.message}</p>
                          </div>`;
		// 오류 화면에도 테마 적용 시도
		applySavedTheme();
	}
});