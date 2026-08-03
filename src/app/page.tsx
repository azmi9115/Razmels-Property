"use client";
import "./landing.css";

import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="landing-page">
      

<header className="flex justify-between items-center w-full px-margin-desktop py-gutter z-50 fixed top-0 bg-transparent">
<div className="flex items-center gap-4">
<img alt="Razmel's Property Logo" className="w-12 h-12 object-contain" src="https://lh3.googleusercontent.com/aida/AP1WRLvn_ZIgptA6HWug51YB0uNLrC6spgciL64KXnwuqRHpdKBQFAIH7-GGKKXcloLVJnaHvogg5dbFRB2xFl1IltEH84oRti0rszS2bBEGgDtf6Q-cvk0PC7v2makkzYdpYRERb8XCpSivBfQb0Z6wtAzOg4DNDjYdJ0lpAV4RU_O-KX6p0EGe6CzJF58LuWg9hSn55t0HlttojlrlMrezumwaKOffa1oPTd4uoAC1-ZhZ_NfEQGicgI_u8Wpn"/>
<div className="font-['Plus_Jakarta_Sans'] text-[32px] font-extrabold tracking-tighter text-[#ffffff] uppercase">
        Razmel's Property
    </div>
</div>
<nav className="hidden md:flex items-center gap-10">
<a className="font-['Space_Mono'] text-label-sm text-[#cdf200] border-b-2 border-[#cdf200] py-1 transition-all" href="#">Portfolio</a>
<a className="font-['Space_Mono'] text-label-sm text-[#908fa0] hover:text-primary transition-colors duration-300 py-1" href="#">About</a>
<a className="font-['Space_Mono'] text-label-sm text-[#908fa0] hover:text-primary transition-colors duration-300 py-1" href="#">Investment</a>
</nav>
<div className="flex items-center gap-6">
<Link href="/login" className="flex items-center gap-2 font-['Space_Mono'] text-label-sm bg-[#cdf200] text-[#181e00] px-6 py-3 rounded-full hover:scale-105 active:scale-95 transition-transform neon-glow-lime font-bold cursor-pointer">
                LOGIN TO DASHBOARD
            </Link>
<span className="material-symbols-outlined text-[#c0c1ff] cursor-pointer">notifications_active</span>
</div>
</header>

<div className="fixed inset-0 pointer-events-none -z-10">
<div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-[#c0c1ff]/10 rounded-full blur-[120px]"></div>
<div className="absolute bottom-1/4 -left-1/4 w-[500px] h-[500px] bg-[#cdf200]/5 rounded-full blur-[100px]"></div>
</div>
<main className="pt-40">

<section className="px-margin-desktop grid grid-cols-12 gap-gutter relative mb-40">

<div className="hidden lg:block col-span-1">
<span className="vertical-text font-['Space_Mono'] text-label-sm text-[#908fa0] tracking-widest opacity-40">EST. MMXXIV — JAKARTA</span>
</div>
<div className="col-span-12 lg:col-span-6 flex flex-col justify-center">
<h1 className="font-['Plus_Jakarta_Sans'] text-display-xl leading-tight mb-8">
                    Curating <span className="text-[#cdf200] italic">Architectural</span> Performance.
                </h1>
<p className="font-['Hanken_Grotesk'] text-[#c7c4d7] max-w-lg mb-12">
                    We redefine property management as an art form. Razmel's Property manages high-performance real estate portfolios with a focus on creative yield and cinematic luxury.
                </p>
<div className="flex gap-4">
<button className="bg-[#c0c1ff] text-[#07006c] font-bold px-10 py-5 rounded-full hover:bg-secondary-fixed transition-colors">
                        Explore Portfolio
                    </button>
<button className="border border-white/20 text-white font-['Space_Mono'] px-10 py-5 rounded-full hover:bg-white/5 transition-all">
                        Inquire Now
                    </button>
</div>
</div>
<div className="col-span-12 lg:col-span-5 relative mt-12 lg:mt-0">
<div className="w-full aspect-[4/5] relative flex items-center justify-center">
<img className="w-3/4 aspect-square object-contain hover:scale-105 transition-all duration-700 rounded-[3rem] shadow-2xl" alt="Razmel's Property Logo" src="/logo-razmel.png"/>
</div>
</div>
</section>

<section className="px-margin-desktop mb-40">
<div className="flex justify-between items-end mb-16">
<div>
<span className="font-['Space_Mono'] text-label-sm text-[#cdf200] uppercase tracking-widest">Collection 01</span>
<h2 className="font-['Plus_Jakarta_Sans'] text-headline-lg mt-2">The Portfolio</h2>
</div>
<div className="font-['Space_Mono'] text-label-sm text-[#908fa0]">
                    [ 03 PROPERTIES ACTIVE ]
                </div>
</div>

<div className="grid grid-cols-12 gap-gutter">

<div className="col-span-12 lg:col-span-8 bg-[#1e2025] overflow-hidden group">
<div className="flex flex-col md:flex-row h-full">
<div className="w-full md:w-3/5 h-80 md:h-auto overflow-hidden">
<img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" data-alt="An interior shot of a high-end designer boarding house room in Jakarta. The aesthetic is Japandi-minimalism with light wood textures, charcoal accent walls, and integrated warm LED lighting. The room is perfectly staged with premium linens, a small workstation, and large windows. The lighting is soft, cinematic, and professional, maintaining a moody, luxurious atmosphere." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDehCPd1N9dPK5xpaFeWV4YSBUKBJ68BW9cXSGgu6Rk8BrLgDKxHmepPHxgoyP1G3y8UZzXkeHCV_ndBTB_95FQM-Qk1DMnnFUmQfDyoLOUArLWGPo1W1R861jJBePXTIoyEoIE2ygGMFOEYZc4ZZaCuyqdm0AEsI3lcRy_J3I_BWVaPicCyICfcj-Oqa5vMypY4omo16pxMSPpnlFpwlIdlq31hpnqHNT7XTgHidEGRKe3nxdj98ILkg"/>
</div>
<div className="w-full md:w-2/5 p-10 flex flex-col justify-between">
<div>
<span className="font-['Space_Mono'] text-[10px] text-[#908fa0] uppercase tracking-tighter block mb-4">ID: RMZ-001 / BOARDING HOUSE</span>
<h3 className="font-['Plus_Jakarta_Sans'] text-2xl mb-6">The Collective Suites</h3><p className="font-['Hanken_Grotesk'] text-sm text-[#908fa0] mb-6">A flagship co-living concept featuring bespoke modular furniture, sound-insulated walls, and private balconies for every unit. Designed for the digital nomad seeking a community-driven lifestyle without compromising on privacy.</p>
<div className="space-y-4">
<div className="flex justify-between items-center border-b border-white/5 pb-2">
<span className="font-['Space_Mono'] text-[#908fa0]">Capacity</span>
<span className="text-white">19 En-suite Rooms</span>
</div>
<div className="flex justify-between items-center border-b border-white/5 pb-2">
<span className="font-['Space_Mono'] text-[#908fa0]">Occupancy</span>
<span className="text-[#cdf200] font-bold">100% Fully Leased</span>
</div>
<div className="flex justify-between items-center border-b border-white/5 pb-2">
<span className="font-['Space_Mono'] text-[#908fa0]">Amenities</span>
<span className="text-white">Fiber, CCTV, Sky Lounge</span>
</div>
</div>
</div>
<button className="mt-12 group/btn flex items-center gap-3 font-['Space_Mono'] text-label-sm uppercase tracking-widest text-[#c0c1ff]">
                                View Details 
                                <span className="material-symbols-outlined group-hover/btn:translate-x-2 transition-transform">arrow_right_alt</span>
</button>
</div>
</div>
</div>

<div className="col-span-12 md:col-span-6 lg:col-span-4 bg-[#1e2025] flex flex-col group">
<div className="h-64 overflow-hidden">
<img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" data-alt="A luxury studio apartment interior with a panoramic city view. The design features industrial chic elements like polished concrete floors, exposed matte black pipes, and high-end Italian furniture. A large floor-to-ceiling window overlooks a neon-lit metropolis at night. The lighting is artistic with cool blue and warm amber tones, creating a cyber-professional aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBw7711o8N0YWRzIjpMMPVrb7VicakzoRTfc2FJLU8fELZ3PVCLQh_uqL2i5ONsdv5rlHsP0lflS_eVntT5C6-5IqZF-XDnuh0GJvsZ4-qZQeHLnA1Kv_3li1Jp_VrmK8D609euQJJLHqpLdg-DSBfFSdJRowBqQQJ3vcbJE2h_1b69rYDGKIhFPiZOdAeJBHVs2CrD_PhySsB4w4lZNLzvQmom4DD4RykxbabCljpp3CxWZmnOEY49CQ"/>
</div>
<div className="p-8 flex-grow flex flex-col justify-between">
<div>
<span className="font-['Space_Mono'] text-[10px] text-[#908fa0] uppercase mb-2 block">ID: RMZ-002 / STUDIO</span>
<h3 className="font-['Plus_Jakarta_Sans'] text-xl mb-4">Lumina Sky Studio</h3><p className="font-['Hanken_Grotesk'] text-sm text-[#908fa0] mb-4">An ultra-modern studio optimized for creative professionals. Features smart-tinting glass, integrated studio-grade acoustics, and a retractable workspace that maximizes the 42 SQM footprint.</p>
<div className="flex items-center gap-2 mb-6">
<span className="w-2 h-2 rounded-full bg-[#cdf200] active-dot"></span>
<span className="font-['Space_Mono'] text-label-sm text-[#cdf200]">Available for Booking</span>
</div>
</div>
<div className="flex justify-between items-center">
<span className="font-['Space_Mono'] text-xl text-white">42 SQM</span>
<button className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-secondary-fixed hover:text-black transition-all">
<span className="material-symbols-outlined">add</span>
</button>
</div>
</div>
</div>

<div className="col-span-12 md:col-span-6 lg:col-span-4 bg-[#1e2025] flex flex-col group">
<div className="h-64 overflow-hidden">
<img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" data-alt="A spacious 2-bedroom luxury apartment living area. The style is 'Obsidian Emerald' with deep green velvet upholstery, dark walnut wood panels, and architectural lighting. The room feels expansive and premium. In the background, a modern kitchen with a black marble island is visible. The atmosphere is sophisticated, moody, and exclusive." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3JRtA0CT0gWnMJ5qNgISOd9RSaxN--DUzI2avm_yLhEyZ4vym9unhojdK0xXwV9SOPBkX-PVEF0Gk-FG4wGYsPXuln2CKdTlLSkBew8iS_8rFwHjbVNec_PML0j_XYB9nU-lRF-gBS8_9e1kialC31N0Un3B90utUVJln6jSWPBHzOsewWZQHpRUuYZxOstaD8OAG0wqrb8RTjpq0as46qdmrPqaxpgMYJYVsUH5UErbHTKkR0MW7BQ"/>
</div>
<div className="p-8 flex-grow flex flex-col justify-between">
<div>
<span className="font-['Space_Mono'] text-[10px] text-[#908fa0] uppercase mb-2 block">ID: RMZ-003 / 2BR RESIDENCE</span>
<h3 className="font-['Plus_Jakarta_Sans'] text-xl mb-4">The Obsidian Suite</h3>
<p className="font-['Hanken_Grotesk'] text-sm text-[#908fa0] mb-4">2 Bedrooms + 1 Bathroom. A masterclass in dark-mode interior design, featuring emerald marble countertops, voice-controlled ambient lighting, and a private terrace overlooking the SCBD skyline.</p>
</div>
<div className="pt-6 border-t border-white/5 flex justify-between items-center">
<span className="font-['Space_Mono'] text-label-sm text-[#c0c1ff] uppercase">Active Portfolio</span>
<span className="material-symbols-outlined text-[#908fa0]">verified</span>
</div>
</div>
</div>

<div className="col-span-12 lg:col-span-8 border border-dashed border-white/20 p-12 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-secondary-fixed/50 transition-all"><div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><span className="material-symbols-outlined text-4xl text-[#908fa0] group-hover:text-secondary-fixed transition-colors">add_business</span></div><h3 className="font-['Plus_Jakarta_Sans'] text-2xl text-[#908fa0] group-hover:text-white transition-colors">Upcoming Developments</h3><p className="font-['Hanken_Grotesk'] text-[#908fa0] max-w-md mt-4">We are currently curating three new landmark locations in Menteng and Uluwatu. Be the first to experience our next evolution in architectural living.</p><button className="mt-8 font-['Space_Mono'] text-label-sm text-[#cdf200] underline underline-offset-8 uppercase tracking-widest">Join the Waitlist</button></div>
</div>
</section>

</main>

<footer className="bg-[#0c0e13] py-20 px-margin-desktop border-t border-white/5">
<div className="grid grid-cols-12 gap-gutter mb-20">
<div className="col-span-12 lg:col-span-4">
<div className="flex items-center gap-4 mb-6">
<img alt="Razmel's Property Logo" className="w-12 h-12 object-contain" src="https://lh3.googleusercontent.com/aida/AP1WRLvn_ZIgptA6HWug51YB0uNLrC6spgciL64KXnwuqRHpdKBQFAIH7-GGKKXcloLVJnaHvogg5dbFRB2xFl1IltEH84oRti0rszS2bBEGgDtf6Q-cvk0PC7v2makkzYdpYRERb8XCpSivBfQb0Z6wtAzOg4DNDjYdJ0lpAV4RU_O-KX6p0EGe6CzJF58LuWg9hSn55t0HlttojlrlMrezumwaKOffa1oPTd4uoAC1-ZhZ_NfEQGicgI_u8Wpn"/>
<div className="font-['Plus_Jakarta_Sans'] text-3xl font-extrabold tracking-tighter text-[#ffffff] uppercase">
        Razmel's Property
    </div>
</div>
<p className="font-['Hanken_Grotesk'] text-[#908fa0] max-w-xs">
                    Avant-garde real estate management for the modern portfolio holder. Jakarta, Indonesia.
                </p>
</div>
<div className="col-span-6 lg:col-span-2">
<h5 className="font-['Space_Mono'] text-label-sm text-white mb-6 uppercase tracking-widest">Connect</h5>
<ul className="space-y-4 font-['Hanken_Grotesk'] text-[#908fa0] text-sm">
<li><a className="hover:text-primary transition-colors" href="#">Instagram</a></li>
<li><a className="hover:text-primary transition-colors" href="#">LinkedIn</a></li>
<li><a className="hover:text-primary transition-colors" href="#">Threads</a></li>
</ul>
</div>
<div className="col-span-6 lg:col-span-2">
<h5 className="font-['Space_Mono'] text-label-sm text-white mb-6 uppercase tracking-widest">Office</h5>
<p className="font-['Hanken_Grotesk'] text-[#908fa0] text-sm leading-loose">
                    SCBD District 8,<br/>Level 24, Tower A<br/>Jakarta Selatan
                </p>
</div>
<div className="col-span-12 lg:col-span-4">
<h5 className="font-['Space_Mono'] text-label-sm text-white mb-6 uppercase tracking-widest">Newsletter</h5>
<div className="flex gap-2">
<input className="bg-white/5 border-none underline-only focus:ring-0 text-white w-full border-b border-white/20 focus:border-primary transition-colors" placeholder="email@address.com" type="email"/>
<button className="bg-[#c0c1ff] text-[#07006c] p-3 rounded-full">
<span className="material-symbols-outlined">north_east</span>
</button>
</div>
</div>
</div>
<div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-white/5">
<span className="font-['Space_Mono'] text-[10px] text-[#908fa0]">© 2024 RAZMEL'S PROPERTY. ALL RIGHTS RESERVED.</span>
<div className="flex gap-8 mt-6 md:mt-0 font-['Space_Mono'] text-[10px] text-[#908fa0] uppercase tracking-widest">
<a className="hover:text-white" href="#">Privacy Policy</a>
<a className="hover:text-white" href="#">Terms of Asset</a>
</div>
</div>
</footer>

<div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-12 px-10 py-4 bg-[#1e2025]/60 backdrop-blur-xl rounded-full border border-white/10 shadow-[0_0_20px_rgba(205,242,0,0.2)] md:hidden">
<div className="flex flex-col items-center justify-center text-[#c7c4d7]">
<span className="material-symbols-outlined">rocket_launch</span>
<span className="font-['Space_Mono'] text-[8px] mt-1">Command</span>
</div>
<div className="relative flex flex-col items-center justify-center text-[#cdf200] after:content-[''] after:absolute after:-bottom-2 after:w-1 after:h-1 after:bg-secondary-fixed after:rounded-full">
<span className="material-symbols-outlined">domain</span>
<span className="font-['Space_Mono'] text-[8px] mt-1">Portfolio</span>
</div>
<div className="flex flex-col items-center justify-center text-[#c7c4d7]">
<span className="material-symbols-outlined">analytics</span>
<span className="font-['Space_Mono'] text-[8px] mt-1">Pulse</span>
</div>
<div className="flex flex-col items-center justify-center text-[#c7c4d7]">
<span className="material-symbols-outlined">payments</span>
<span className="font-['Space_Mono'] text-[8px] mt-1">Ledger</span>
</div>
<div className="flex flex-col items-center justify-center text-[#c7c4d7]">
<span className="material-symbols-outlined">architecture</span>
<span className="font-['Space_Mono'] text-[8px] mt-1">Studio</span>
</div>
</div>


    </div>
  );
}
