// =============================================================================
// BUNDLE ANALYZER UTILITIES
// =============================================================================

interface BundleInfo {
  name: string;
  size: number;
  gzippedSize: number;
  chunks: string[];
  modules: Array<{
    name: string;
    size: number;
    gzippedSize: number;
  }>;
}

class BundleAnalyzer {
  private bundleInfo: BundleInfo[] = [];

  // Analyze bundle size
  analyzeBundleSize = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Bundle Analysis:');
      console.log('Total bundles:', this.bundleInfo.length);
      
      this.bundleInfo.forEach(bundle => {
        console.log(`📦 ${bundle.name}:`);
        console.log(`  Size: ${(bundle.size / 1024).toFixed(2)} KB`);
        console.log(`  Gzipped: ${(bundle.gzippedSize / 1024).toFixed(2)} KB`);
        console.log(`  Chunks: ${bundle.chunks.length}`);
      });
    }
  };

  // Get optimization suggestions
  getOptimizationSuggestions = (): string[] => {
    const suggestions: string[] = [];

    this.bundleInfo.forEach(bundle => {
      // Suggest code splitting for large bundles
      if (bundle.size > 500 * 1024) { // 500KB
        suggestions.push(`Consider code splitting for ${bundle.name} (${(bundle.size / 1024).toFixed(2)} KB)`);
      }

      // Suggest lazy loading for large modules
      bundle.modules.forEach(module => {
        if (module.size > 100 * 1024) { // 100KB
          suggestions.push(`Consider lazy loading for ${module.name} (${(module.size / 1024).toFixed(2)} KB)`);
        }
      });
    });

    return suggestions;
  };

  // Monitor bundle size over time
  monitorBundleSize = () => {
    const bundleSize = this.getTotalBundleSize();
    const previousSize = localStorage.getItem('previousBundleSize');
    
    if (previousSize) {
      const sizeDifference = bundleSize - parseInt(previousSize);
      const percentageChange = (sizeDifference / parseInt(previousSize)) * 100;
      
      if (Math.abs(percentageChange) > 10) {
        console.warn(`⚠️ Bundle size changed by ${percentageChange.toFixed(2)}%`);
      }
    }
    
    localStorage.setItem('previousBundleSize', bundleSize.toString());
  };

  // Get total bundle size
  getTotalBundleSize = (): number => {
    return this.bundleInfo.reduce((total, bundle) => total + bundle.size, 0);
  };

  // Get bundle size by chunk
  getBundleSizeByChunk = (chunkName: string): number => {
    const bundle = this.bundleInfo.find(b => b.chunks.includes(chunkName));
    return bundle ? bundle.size : 0;
  };

  // Analyze lazy loading effectiveness
  analyzeLazyLoading = () => {
    const lazyLoadedBundles = this.bundleInfo.filter(bundle => 
      bundle.name.includes('lazy') || bundle.name.includes('chunk')
    );

    const totalLazySize = lazyLoadedBundles.reduce((total, bundle) => total + bundle.size, 0);
    const totalSize = this.getTotalBundleSize();
    const lazyLoadingPercentage = (totalLazySize / totalSize) * 100;

    console.log(`📊 Lazy Loading Analysis:`);
    console.log(`Lazy loaded bundles: ${lazyLoadedBundles.length}`);
    console.log(`Lazy loading coverage: ${lazyLoadingPercentage.toFixed(2)}%`);

    if (lazyLoadingPercentage < 30) {
      console.warn('⚠️ Consider implementing more lazy loading for better performance');
    }
  };
}

// Create singleton instance
const bundleAnalyzer = new BundleAnalyzer();

export default bundleAnalyzer;
