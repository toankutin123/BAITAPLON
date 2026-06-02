from playwright.sync_api import sync_playwright, Page, Browser
from typing import List, Optional, Callable
import logging
from abc import ABC, abstractmethod


class BaseCrawler(ABC):
    """Base class for all crawlers."""
    
    def __init__(
        self,
        headless: bool = True,
        timeout: int = 60000,
        retry_count: int = 3,
        delay_seconds: float = 2.0,
        user_agent: str = None,
    ):
        """
        Initialize crawler.
        
        Args:
            headless: Run browser in headless mode
            timeout: Page load timeout in milliseconds
            retry_count: Number of retries on failure
            delay_seconds: Delay between requests
            user_agent: Custom user agent string
        """
        self.headless = headless
        self.timeout = timeout
        self.retry_count = retry_count
        self.delay_seconds = delay_seconds
        self.user_agent = user_agent or (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
        
        self.logger = logging.getLogger(self.__class__.__name__)
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.playwright = None
    
    def __enter__(self):
        """Context manager entry."""
        self.start()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.stop()
    
    def start(self):
        """Start the browser."""
        self.playwright = sync_playwright().start()
        
        # Launch browser with anti-detection
        self.browser = self.playwright.chromium.launch(
            headless=self.headless,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--disable-dev-shm-usage",
                "--no-sandbox",
                "--disable-gpu",
            ]
        )
        
        # Create context with user agent
        context = self.browser.new_context(
            user_agent=self.user_agent,
            viewport={"width": 1920, "height": 1080},
            locale="vi-VN",
        )
        
        self.page = context.new_page()
        
        # Block unnecessary resources
        self._setup_resource_blocking()
        
        self.logger.info("Browser started")
    
    def stop(self):
        """Stop the browser."""
        if self.page:
            self.page.close()
            self.page = None
        
        if self.browser:
            self.browser.close()
            self.browser = None
        
        if self.playwright:
            self.playwright.stop()
            self.playwright = None
        
        self.logger.info("Browser stopped")
    
    def _setup_resource_blocking(self):
        """Block unnecessary resources for faster crawling."""
        # Block images for faster loading (optional)
        # self.page.route("**/*.{png,jpg,jpeg,gif,svg,ico}", lambda route: route.abort())
        pass
    
    def wait_for_selectors(
        self, 
        selectors: List[str], 
        timeout: int = 15000
    ) -> bool:
        """
        Wait for any of the selectors to appear.
        
        Args:
            selectors: List of CSS selectors
            timeout: Timeout in milliseconds
        
        Returns:
            True if any selector found, False otherwise
        """
        import time
        start_time = time.time()
        
        while time.time() - start_time < timeout / 1000:
            for selector in selectors:
                try:
                    element = self.page.query_selector(selector)
                    if element:
                        return True
                except:
                    continue
            time.sleep(0.5)
        
        return False
    
    def scroll_to_load(
        self, 
        max_scrolls: int = 10,
        scroll_distance: int = 3000,
        wait_time: float = 1.0
    ):
        """
        Scroll page to load lazy content.
        
        Args:
            max_scrolls: Maximum number of scrolls
            scroll_distance: Pixels to scroll each time
            wait_time: Wait time between scrolls
        """
        import time
        
        for _ in range(max_scrolls):
            self.page.mouse.wheel(0, scroll_distance)
            time.sleep(wait_time)
    
    def retry_on_failure(
        self,
        func: Callable,
        *args,
        **kwargs
    ) -> Optional[any]:
        """
        Retry function on failure.
        
        Args:
            func: Function to execute
            *args, **kwargs: Arguments for the function
        
        Returns:
            Function result or None if all retries failed
        """
        last_error = None
        
        for attempt in range(self.retry_count):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                last_error = e
                self.logger.warning(
                    f"Attempt {attempt + 1}/{self.retry_count} failed: {e}"
                )
                
                if attempt < self.retry_count - 1:
                    import time
                    time.sleep(self.delay_seconds * (attempt + 1))
        
        self.logger.error(f"All {self.retry_count} attempts failed: {last_error}")
        return None
    
    def with_delay(self, func: Callable, *args, **kwargs) -> Optional[any]:
        """Execute function with delay."""
        import time
        time.sleep(self.delay_seconds)
        return func(*args, **kwargs)
    
    @abstractmethod
    def get_listing_urls(self, *args, **kwargs) -> List[str]:
        """Get listing URLs from a page. Must be implemented by subclass."""
        pass
    
    @abstractmethod
    def crawl_listing(self, url: str) -> Optional[dict]:
        """Crawl a single listing. Must be implemented by subclass."""
        pass
    
    @abstractmethod
    def extract_data(self) -> dict:
        """Extract data from current page. Must be implemented by subclass."""
        pass
