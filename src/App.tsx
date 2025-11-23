import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Download, UploadCloud, Cpu, Layers, Zap, CheckCircle, XCircle, FileText, Code, Globe, Home, ChevronLeft, ChevronRight, Image } from 'lucide-react';

// --- Type Definitions ---
type Page = 'home' | 'features' | 'processor' | 'about';

interface IFeature {
  icon: React.JSX.Element;
  title: string;
  description: string;
}

interface IProcessData {
  [key: string]: string | number;
}

interface IGLTFProcessResult {
  isValid: boolean;
  message: string;
  data: IProcessData | null;
  isBinary: boolean;
}

interface IHeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

interface IHeroSectionProps {
  onNavigate: (page: Page) => void;
}

interface IImageCarouselProps {
  images: string[];
}

// --- Page Definitions ---
const PAGES: Record<string, Page> = {
  HOME: 'home',
  FEATURES: 'features',
  PROCESSOR: 'processor',
  ABOUT: 'about',
};

// --- Data Structure ---
const PLUGIN_FEATURES: IFeature[] = [
  {
    icon: <Layers className="w-6 h-6 text-indigo-400" />,
    title: "Optimized Mesh Instancing",
    description: "Intelligently group and instance static meshes to significantly reduce draw calls and memory footprint in large Roblox worlds.",
  },
  {
    icon: <Cpu className="w-6 h-6 text-indigo-400" />,
    title: "Real-Time LOD Generation",
    description: "Automatically create Level-of-Detail (LOD) models on the fly, ensuring smooth performance regardless of camera distance.",
  },
  {
    icon: <Zap className="w-6 h-6 text-indigo-400" />,
    title: "One-Click Material Conversion",
    description: "Convert PBR materials from glTF/Blender to Roblox's new MaterialService standards with a single, non-destructive operation.",
  },
  {
    icon: <Globe className="w-6 h-6 text-indigo-400" />,
    title: "Dynamic World Partitioning",
    description: "Segment massive external maps into Roblox-compatible chunks, integrating perfectly with streaming and world limits.",
  },
];

const carouselImages: string[] = [
  'https://via.placeholder.com/1200x600/1e293b/a5b4fc?text=Plugin+Screenshot+1', // Placeholder for feature 1
  'https://via.placeholder.com/1200x600/1e293b/a5b4fc?text=Optimized+Roblox+World', // Placeholder for feature 2
  'https://via.placeholder.com/1200x600/1e293b/a5b4fc?text=Material+Converter+UI', // Placeholder for feature 3
  'https://via.placeholder.com/1200x600/1e293b/a5b4fc?text=GLTF+Import+Workflow', // Placeholder for feature 4
];


// --- Utility Functions ---

/**
 * Attempts to parse glTF data (JSON or binary metadata) and returns structure/errors.
 * @param {string | ArrayBuffer | null} data - The content of the glTF file (JSON string or binary ArrayBuffer).
 * @param {boolean} isBinary - True if the input is a .glb file.
 * @returns {IGLTFProcessResult}
 */
const processGLTF = (data: string | ArrayBuffer | null, isBinary: boolean): IGLTFProcessResult => {
  if (!data) {
    // This path is hit when mocking the file upload analysis
    const mockData: IProcessData = {
      Format: isBinary ? "GLB (Binary)" : "GLTF (JSON)",
      Meshes: isBinary ? '128' : '24', // Mock counts
      ImagesToProcess: isBinary ? '12' : '4', // Mock counts
    };
    return {
      isValid: true,
      message: isBinary
        ? "GLB File detected. Header structure validated. Ready for texture extraction!"
        : "GLTF file detected. Structure validated. Ready for texture extraction!",
      data: mockData,
      isBinary: isBinary
    };
  }

  try {
    if (isBinary && data instanceof ArrayBuffer) {
      // Mocked GLB header check for consistency
      const version = 2;
      const length = data.byteLength;

      const binaryData: IProcessData = {
        Format: "GLB (Binary)",
        Version: version,
        Length: `${(length / 1024 / 1024).toFixed(2)} MB`,
        Note: "Binary content requires specialized parsing. Metadata inferred from header."
      };
      return {
        isValid: true,
        message: `GLB File Structure Valid. Version: ${version}, Total Length: ${length} bytes.`,
        data: binaryData,
        isBinary: true
      };

    } else if (typeof data === 'string') {
      // For GLTF (JSON)
      const json = JSON.parse(data);

      if (!json.asset || !json.asset.version) {
        throw new Error("JSON is valid, but missing required 'asset' property with a 'version'.");
      }

      const meshCount: number = json.meshes ? json.meshes.length : 0;
      const nodeCount: number = json.nodes ? json.nodes.length : 0;
      const materialCount: number = json.materials ? json.materials.length : 0;

      const jsonData: IProcessData = {
        AssetVersion: json.asset.version,
        Meshes: meshCount,
        Nodes: nodeCount,
        Materials: materialCount,
        ExtensionsUsed: json.extensionsUsed ? json.extensionsUsed.join(', ') : 'None'
      };

      return {
        isValid: true,
        message: `glTF JSON Validated. Ready for import!`,
        data: jsonData,
        isBinary: false
      };
    } else {
      throw new Error("Invalid data format for the selected mode.");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown processing error occurred.';
    return {
      isValid: false,
      message: `Processing Error: ${errorMessage}`,
      data: null,
      isBinary
    };
  }
};

// --- Components ---

const Header: React.FC<IHeaderProps> = ({ currentPage, onNavigate }) => (
  <header className="bg-gray-900 border-b border-gray-800 p-4 fixed w-full z-10 shadow-lg">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <div className="flex items-center space-x-6">
        <button onClick={() => onNavigate(PAGES.HOME)} className="flex items-center text-2xl font-bold text-indigo-400 font-mono hover:text-indigo-500 transition duration-300">
          <span className="text-gray-100">Roblox</span>
          <span className="text-indigo-500">GLTF</span>Pro
        </button>
      </div>

      <nav className="hidden md:flex space-x-6">
        <button
          onClick={() => onNavigate(PAGES.HOME)}
          className={`py-1 px-2 transition duration-300 flex items-center ${currentPage === PAGES.HOME ? 'text-indigo-400 font-bold' : 'text-gray-300 hover:text-indigo-400'}`}
        >
          <Home className="w-5 h-5 mr-1" /> Home
        </button>
        {/* The Features navigation link was removed as the features are now shown on the Home page */}
        <button
          onClick={() => onNavigate(PAGES.PROCESSOR)}
          className={`py-1 px-2 transition duration-300 ${currentPage === PAGES.PROCESSOR ? 'text-indigo-400 font-bold' : 'text-gray-300 hover:text-indigo-400'}`}
        >
          Tools
        </button>
        <button
          onClick={() => onNavigate(PAGES.ABOUT)}
          className={`py-1 px-2 transition duration-300 ${currentPage === PAGES.ABOUT ? 'text-indigo-400 font-bold' : 'text-gray-300 hover:text-indigo-400'}`}
        >
          About
        </button>
      </nav>
      <a
        href="https://www.roblox.com/library/12345/MyPlugin" // Placeholder link
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 flex items-center space-x-2"
      >
        <Download className="w-5 h-5" />
        <span>Get Plugin</span>
      </a>
    </div>
  </header>
);

const HeroSection: React.FC<IHeroSectionProps> = ({ onNavigate }) => (
  <section className="pt-32 pb-16 bg-gray-900 text-center relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-900 opacity-20"></div>
    <div className="max-w-4xl mx-auto px-4 relative z-10">
      <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
        The Ultimate <span className="text-indigo-400">3D Asset</span> Pipeline for Roblox.
      </h2>
      <p className="text-xl text-gray-400 mb-10">
        Stop wrestling with complex imports. Our plugin handles glTF, PBR, and mesh optimization, letting you focus on building incredible experiences, not fixing file errors.
      </p>
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => onNavigate(PAGES.PROCESSOR)}
          className="px-8 py-4 bg-indigo-600 text-white text-lg font-bold rounded-xl shadow-2xl shadow-indigo-500/50 hover:bg-indigo-700 transition duration-300 transform hover:scale-105"
        >
          Try the GLTF Processor Now
        </button>
        <button
          onClick={() => onNavigate(PAGES.FEATURES)}
          className="px-8 py-4 border-2 border-gray-700 text-gray-300 text-lg font-semibold rounded-xl hover:bg-gray-800 transition duration-300 transform hover:scale-105"
        >
          See All Features
        </button>
      </div>
    </div>
  </section>
);

const ImageCarousel: React.FC<IImageCarouselProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const intervalRef = useRef<number | undefined>(undefined);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length]);

  const goToPrevious = (): void => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const goToSlide = (index: number): void => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    // Auto-scroll
    intervalRef.current = window.setInterval(goToNext, 5000); // Change image every 5 seconds

    return () => {
      if (intervalRef.current !== undefined) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [goToNext]);

  // Pause on hover
  const handleMouseEnter = (): void => {
    if (intervalRef.current !== undefined) {
      window.clearInterval(intervalRef.current);
    }
  };

  const handleMouseLeave = (): void => {
    intervalRef.current = window.setInterval(goToNext, 5000);
  };

  return (
    // Updated container to enforce aspect ratio and max height
    <div className="relative w-full max-w-6xl mx-auto my-8 md:my-16 overflow-hidden rounded-xl shadow-2xl border border-gray-700 aspect-video max-h-[600px]"
      onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>

      {/* Updated inner container to use absolute positioning and h-full */}
      <div className="absolute inset-0 flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {images.map((image, index) => (
          // Inner slide must also be h-full
          <div key={index} className="w-full h-full flex-shrink-0">
            <img
              src={image}
              alt={`Plugin Feature ${index + 1}`}
              // Image must use h-full and object-cover to scale correctly within the aspect-video container
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-gray-800/60 hover:bg-gray-800/90 text-white p-2 rounded-full transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 z-10"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-gray-800/60 hover:bg-gray-800/90 text-white p-2 rounded-full transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 z-10"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Navigation Dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${currentIndex === index ? 'bg-indigo-500 scale-125' : 'bg-gray-400 hover:bg-gray-200'
              }`}
          ></button>
        ))}
      </div>
    </div>
  );
};


const FeaturesSection: React.FC = () => (
  // Removed pt-16 here to prevent excessive top padding when placed on the homepage
  <section className="py-20 bg-gray-950 border-t border-gray-800 min-h-screen">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-4xl font-bold text-center text-white mb-4">
        Engineered for <span className="text-indigo-400">Performance</span>
      </h2>
      <p className="text-xl text-center text-gray-500 mb-16">
        Unlock next-level quality and speed in your Roblox development lifecycle.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {PLUGIN_FEATURES.map((feature, index) => (
          <div
            key={index}
            className="p-6 bg-gray-900 rounded-xl border border-gray-800 hover:border-indigo-600 transition duration-300 transform hover:shadow-xl hover:shadow-indigo-900/30"
          >
            <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-indigo-900/50 border border-indigo-700">
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
            <p className="text-gray-400">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const GLTFProcessor: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [processingResult, setProcessingResult] = useState<IGLTFProcessResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<'upload' | 'paste'>('upload'); // 'upload' or 'paste'
  const [alphaBleedingEnabled, setAlphaBleedingEnabled] = useState<boolean>(false); // State for alpha bleeding

  const handleProcess = useCallback((): (() => (void)) => {
    setIsLoading(true);
    setProcessingResult(null);

    // Simulate API delay
    const timeoutId = setTimeout(() => {
      let result: IGLTFProcessResult | null = null;
      let isBinary: boolean = false;

      if (mode === 'upload' && fileInput) {
        isBinary = fileInput.name.toLowerCase().endsWith('.glb');
        result = processGLTF(null, isBinary); // Mock processing a file
      } else if (mode === 'paste' && inputText) {
        result = processGLTF(inputText, false);
      } else {
        result = { isValid: false, message: "Please provide file data or paste JSON.", data: null, isBinary: false };
      }

      // Append the alpha bleeding status to the result data for demonstration
      if (result && result.data) {
        result.data['Image Alpha Bleeding'] = alphaBleedingEnabled ? 'Enabled (2px Dilation)' : 'Disabled';
      }

      setProcessingResult(result);
      setIsLoading(false);
    }, 500); // Small delay for realism

    // Clear timeout on unmount or re-run
    return () => clearTimeout(timeoutId);
  }, [mode, fileInput, inputText, alphaBleedingEnabled]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files ? event.target.files[0] : null;
    if (!file) return;

    setFileInput(file);
    setInputText(''); // Clear text input mode if file is selected
    setProcessingResult(null); // Clear previous result

    const isBinary: boolean = file.name.toLowerCase().endsWith('.glb');
    const reader = new FileReader();

    reader.onloadstart = () => setIsLoading(true);
    reader.onload = (e: ProgressEvent<FileReader>) => {
      let data: string | ArrayBuffer | null = e.target?.result ?? null;
      let result: IGLTFProcessResult;

      if (data) {
        // Actual file data parsing is complex, we just check headers and run the mock process
        if (isBinary && data instanceof ArrayBuffer) {
          result = processGLTF(data, true);
        } else if (typeof data === 'string') {
          result = processGLTF(data, false);
        } else {
          result = { isValid: false, message: "Unsupported file reader result type.", data: null, isBinary: isBinary };
        }
      } else {
        result = { isValid: false, message: "File data could not be read.", data: null, isBinary: isBinary };
      }

      // Append the alpha bleeding status to the result data for demonstration
      if (result && result.data) {
        result.data['Image Alpha Bleeding'] = alphaBleedingEnabled ? 'Enabled (2px Dilation)' : 'Disabled';
      }

      setProcessingResult(result);
      setIsLoading(false);
    };
    reader.onerror = () => {
      setProcessingResult({ isValid: false, message: "Error reading file.", data: null, isBinary });
      setIsLoading(false);
    };

    // Read the file based on type to simulate correct reading
    if (isBinary) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleModeToggle = (newMode: 'upload' | 'paste'): void => {
    setMode(newMode);
    setFileInput(null);
    setInputText('');
    setProcessingResult(null);
  }

  const resultIcon = useMemo(() => {
    if (!processingResult) return null;
    const commonClasses = "w-8 h-8 mr-3";
    if (processingResult.isValid) {
      return <CheckCircle className={`${commonClasses} text-green-400`} />;
    }
    return <XCircle className={`${commonClasses} text-red-400`} />;
  }, [processingResult]);

  return (
    <section className="py-20 bg-gray-900 border-t border-gray-800 min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center text-white mb-4">
          <span className="text-indigo-400">GLTF</span> Validation Sandbox
        </h2>
        <p className="text-xl text-center text-gray-500 mb-12">
          Quickly check your asset structure and metadata before a full import.
        </p>

        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-4xl mx-auto border border-gray-700">
          {/* Mode Tabs */}
          <div className="flex border-b border-gray-700 mb-6">
            <button
              onClick={() => handleModeToggle('upload')}
              className={`py-3 px-6 font-semibold rounded-t-lg transition duration-300 ${mode === 'upload' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'
                }`}
            >
              <UploadCloud className="inline w-5 h-5 mr-2" /> Upload File (.gltf / .glb)
            </button>
            <button
              onClick={() => handleModeToggle('paste')}
              className={`py-3 px-6 font-semibold rounded-t-lg transition duration-300 ${mode === 'paste' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'
                }`}
            >
              <FileText className="inline w-5 h-5 mr-2" /> Paste JSON (.gltf)
            </button>
          </div>

          {/* Alpha Bleeding Toggle (Relocated) */}
          <div className="flex items-center space-x-3 mb-6 p-3 bg-gray-700 rounded-lg">
            <Image className="w-5 h-5 text-indigo-400" />
            <label htmlFor="alpha-bleeding" className="text-gray-300 font-medium cursor-pointer flex items-center">
              Enable Texture Alpha Bleeding
              <span className="ml-2 text-xs text-gray-400">(Prevents texture bleeding/edge artifacts)</span>
            </label>

            <button
              id="alpha-bleeding"
              onClick={() => setAlphaBleedingEnabled(prev => !prev)}
              className={`relative ml-auto inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-700 ${alphaBleedingEnabled ? 'bg-green-600' : 'bg-gray-600'}`}
              aria-pressed={alphaBleedingEnabled}
            >
              <span className="sr-only">Toggle alpha bleeding</span>
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${alphaBleedingEnabled ? 'translate-x-5' : 'translate-x-0'}`}
              ></span>
            </button>
          </div>


          {/* Input Area */}
          {mode === 'upload' ? (
            <div className="flex flex-col items-center justify-center p-10 border-4 border-dashed border-indigo-700 rounded-lg bg-gray-700/50">
              <UploadCloud className="w-12 h-12 text-indigo-400 mb-3" />
              <p className="text-white text-lg font-semibold mb-2">Drag & Drop or Click to Upload</p>
              <p className="text-gray-400 text-sm mb-4">Select file to automatically run validation.</p>
              <input
                type="file"
                accept=".gltf,.glb"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100"
              />
              {fileInput && <p className="mt-3 text-sm text-green-400">File selected: {fileInput.name}</p>}
            </div>
          ) : (
            <div className="flex flex-col">
              <textarea
                value={inputText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
                rows={10}
                placeholder="Paste your glTF JSON content here..."
                className="w-full p-4 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm resize-none"
              ></textarea>
              <button
                onClick={handleProcess}
                disabled={!inputText || isLoading}
                className={`mt-4 py-3 px-6 rounded-lg text-white font-bold transition duration-300 ${!inputText || isLoading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 transform hover:scale-[1.01]'
                  }`}
              >
                {isLoading ? 'Processing...' : 'Process glTF JSON'}
              </button>
            </div>
          )}


          {/* Result Area */}
          {processingResult && (
            <div className={`mt-8 p-6 rounded-lg ${processingResult.isValid ? 'bg-green-900/40 border border-green-700' : 'bg-red-900/40 border border-red-700'
              }`}>
              <div className="flex items-center mb-4">
                {resultIcon}
                <h3 className="2xl font-bold text-white">
                  {processingResult.isValid ? 'Success' : 'Validation Failed'}
                </h3>
              </div>
              <p className={`mb-4 ${processingResult.isValid ? 'text-green-300' : 'text-red-300'}`}>
                {processingResult.message}
              </p>

              {processingResult.data && (
                <div className="space-y-2 p-4 bg-gray-700 rounded-lg">
                  <h4 className="text-lg font-semibold text-white border-b border-gray-600 pb-2 flex items-center">
                    <Code className="w-4 h-4 mr-2" /> Extracted Metadata & Settings:
                  </h4>
                  {Object.entries(processingResult.data).map(([key, value]) => (
                    <p key={key} className="text-sm text-gray-300">
                      <span className="font-mono text-indigo-300 pr-2">{key}:</span>
                      {value}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const AboutSection: React.FC = () => (
  <section className="py-20 bg-gray-950 border-t border-gray-800 min-h-screen pt-16">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
      <h2 className="text-4xl font-bold text-center text-white mb-8">
        About <span className="text-indigo-400">RobloxGLTFPro</span>
      </h2>
      <div className="bg-gray-900 p-8 rounded-xl shadow-xl border border-gray-800 space-y-6 text-gray-400">
        <p>
          RobloxGLTFPro was created by passionate developers who recognized the friction points in the 3D asset pipeline for Roblox creators. Importing complex scenes, managing LODs, and converting advanced PBR materials has historically been tedious and time-consuming.
        </p>
        <p>
          Our plugin is designed to bridge the gap between industry-standard tools (like Blender and Maya) and the Roblox engine, automating optimization and conversion processes so you can spend less time fixing imports and more time building engaging worlds.
        </p>
        <h3 className="text-2xl font-semibold text-indigo-400 mt-6 mb-3">Our Mission</h3>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>To provide the most robust and reliable glTF integration available on the platform.</li>
          <li>To prioritize performance and reduce the memory footprint of imported assets.</li>
          <li>To empower all creators, regardless of technical skill, to use high-quality 3D assets.</li>
        </ul>
        <p className="pt-4 text-sm text-center border-t border-gray-700 mt-8">
          For support, feature requests, or collaboration opportunities, please reach out via our Roblox Group or Discord channel.
        </p>
      </div>
    </div>
  </section>
);

const Footer: React.FC = () => (
  <footer className="bg-gray-950 border-t border-gray-800 py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
      <p className="mb-2">
        &copy; {new Date().getFullYear()} RobloxGLTFPro. Built for the future of Roblox development.
      </p>
      <div className="flex justify-center space-x-6">
        <button className="hover:text-indigo-400 transition" onClick={() => console.log('Privacy policy clicked')}>Privacy Policy</button>
        <button className="hover:text-indigo-400 transition" onClick={() => console.log('Terms of Service clicked')}>Terms of Service</button>
      </div>
    </div>
  </footer>
);

// --- Main App Component ---

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(PAGES.HOME);

  // Function to render the correct content based on the current page state
  const renderPageContent = (): React.JSX.Element => {
    switch (currentPage) {
      case PAGES.HOME:
        return (
          <>
            <HeroSection onNavigate={setCurrentPage} />
            <ImageCarousel images={carouselImages} />
            <FeaturesSection />
          </>
        );
      case PAGES.FEATURES:
        return <FeaturesSection />;
      case PAGES.PROCESSOR:
        return <GLTFProcessor />;
      case PAGES.ABOUT:
        return <AboutSection />;
      default:
        return <HeroSection onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 font-sans">
      <style>{`
        /* Custom style to ensure the page content always starts below the fixed header */
        .min-h-screen-minus-header {
            min-height: calc(100vh - 64px); /* Assuming header height is around 64px (p-4 + padding/text size) */
        }
      `}</style>
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className={currentPage !== PAGES.HOME ? "pt-16" : ""}>
        {renderPageContent()}
      </main>
      <Footer />
    </div>
  );
};

export default App;