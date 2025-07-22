// 'use client';

// import React, { useEffect, useRef, useCallback, useMemo } from 'react';

// interface ProfileCardProps {
//   avatarUrl: string;
//   iconUrl?: string;
//   grainUrl?: string;
//   behindGradient?: string;
//   innerGradient?: string;
//   showBehindGradient?: boolean;
//   className?: string;
//   enableTilt?: boolean;
//   enableMobileTilt?: boolean;
//   mobileTiltSensitivity?: number;
//   miniAvatarUrl?: string;
//   name?: string;
//   title?: string;
//   handle?: string;
//   status?: string;
//   contactText?: string;
//   showUserInfo?: boolean;
//   onContactClick?: () => void;
// }

// const DEFAULT_BEHIND_GRADIENT =
//   "radial-gradient(farthest-side circle at var(--pointer-x) var(--pointer-y),hsla(266,100%,90%,var(--card-opacity)) 4%,hsla(266,50%,80%,calc(var(--card-opacity)*0.75)) 10%,hsla(266,25%,70%,calc(var(--card-opacity)*0.5)) 50%,hsla(266,0%,60%,0) 100%),radial-gradient(35% 52% at 55% 20%,#00ffaac4 0%,#073aff00 100%),radial-gradient(100% 100% at 50% 50%,#00c1ffff 1%,#073aff00 76%),conic-gradient(from 124deg at 50% 50%,#c137ffff 0%,#07c6ffff 40%,#07c6ffff 60%,#c137ffff 100%)";

// const DEFAULT_INNER_GRADIENT =
//   "linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)";

// const ANIMATION_CONFIG = {
//   SMOOTH_DURATION: 600,
//   INITIAL_DURATION: 1500,
//   INITIAL_X_OFFSET: 70,
//   INITIAL_Y_OFFSET: 60,
//   DEVICE_BETA_OFFSET: 20,
// } as const;

// const clamp = (value: number, min = 0, max = 100): number =>
//   Math.min(Math.max(value, min), max);

// const round = (value: number, precision = 3): number =>
//   parseFloat(value.toFixed(precision));

// const adjust = (
//   value: number,
//   fromMin: number,
//   fromMax: number,
//   toMin: number,
//   toMax: number
// ): number =>
//   round(toMin + ((toMax - toMin) * (value - fromMin)) / (fromMax - fromMin));

// const easeInOutCubic = (x: number): number =>
//   x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

// const ProfileCardComponent: React.FC<ProfileCardProps> = ({
//   avatarUrl = "https://via.placeholder.com/150",
//   iconUrl, // No default to avoid broken image for effects that use it directly
//   grainUrl, // No default
//   behindGradient,
//   innerGradient,
//   showBehindGradient = true,
//   className = "",
//   enableTilt = true,
//   enableMobileTilt = false,
//   mobileTiltSensitivity = 5,
//   miniAvatarUrl,
//   name = "Javi A. Torres",
//   title = "Software Engineer",
//   handle = "javicodes",
//   status = "Online",
//   contactText = "Contact",
//   showUserInfo = true,
//   onContactClick,
// }) => {
//   const wrapRef = useRef<HTMLDivElement>(null);
//   const cardRef = useRef<HTMLDivElement>(null);

//   const animationHandlers = useMemo(() => {
//     if (!enableTilt) return null;

//     let rafId: number | null = null;

//     const updateCardTransform = (
//       offsetX: number,
//       offsetY: number,
//       card: HTMLElement,
//       wrap: HTMLElement
//     ) => {
//       const width = card.clientWidth;
//       const height = card.clientHeight;

//       const percentX = clamp((100 / width) * offsetX);
//       const percentY = clamp((100 / height) * offsetY);

//       const centerX = percentX - 50;
//       const centerY = percentY - 50;

//       const properties = {
//         "--pointer-x": `${percentX}%`,
//         "--pointer-y": `${percentY}%`,
//         "--background-x": `${adjust(percentX, 0, 100, 35, 65)}%`,
//         "--background-y": `${adjust(percentY, 0, 100, 35, 65)}%`,
//         "--pointer-from-center": `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
//         "--pointer-from-top": `${percentY / 100}`,
//         "--pointer-from-left": `${percentX / 100}`,
//         "--rotate-x": `${round(-(centerX / 5))}deg`,
//         "--rotate-y": `${round(centerY / 4)}deg`,
//       };

//       Object.entries(properties).forEach(([property, value]) => {
//         wrap.style.setProperty(property, value);
//       });
//     };

//     const createSmoothAnimation = (
//       duration: number,
//       startX: number,
//       startY: number,
//       card: HTMLElement,
//       wrap: HTMLElement
//     ) => {
//       const startTime = performance.now();
//       const targetX = wrap.clientWidth / 2;
//       const targetY = wrap.clientHeight / 2;

//       const animationLoop = (currentTime: number) => {
//         const elapsed = currentTime - startTime;
//         const progress = clamp(elapsed / duration);
//         const easedProgress = easeInOutCubic(progress);

//         const currentX = adjust(easedProgress, 0, 1, startX, targetX);
//         const currentY = adjust(easedProgress, 0, 1, startY, targetY);

//         updateCardTransform(currentX, currentY, card, wrap);

//         if (progress < 1) {
//           rafId = requestAnimationFrame(animationLoop);
//         }
//       };

//       rafId = requestAnimationFrame(animationLoop);
//     };

//     return {
//       updateCardTransform,
//       createSmoothAnimation,
//       cancelAnimation: () => {
//         if (rafId) {
//           cancelAnimationFrame(rafId);
//           rafId = null;
//         }
//       },
//     };
//   }, [enableTilt]);

//   const handlePointerMove = useCallback(
//     (event: PointerEvent) => {
//       const card = cardRef.current;
//       const wrap = wrapRef.current;

//       if (!card || !wrap || !animationHandlers) return;

//       const rect = card.getBoundingClientRect();
//       animationHandlers.updateCardTransform(
//         event.clientX - rect.left,
//         event.clientY - rect.top,
//         card,
//         wrap
//       );
//     },
//     [animationHandlers]
//   );

//   const handlePointerEnter = useCallback(() => {
//     const card = cardRef.current;
//     const wrap = wrapRef.current;

//     if (!card || !wrap || !animationHandlers) return;

//     animationHandlers.cancelAnimation();
//     // Use Tailwind's 'group-hover' for styles or explicitly add/remove classes
//     // For dynamic behavior not covered by group-hover, manual class toggling is fine.
//     wrap.classList.add("active-tilt"); // Custom class for hover state
//     card.classList.add("active-tilt"); // Custom class for hover state
//   }, [animationHandlers]);

//   const handlePointerLeave = useCallback(
//     (event: PointerEvent) => {
//       const card = cardRef.current;
//       const wrap = wrapRef.current;

//       if (!card || !wrap || !animationHandlers) return;

//       animationHandlers.createSmoothAnimation(
//         ANIMATION_CONFIG.SMOOTH_DURATION,
//         event.offsetX,
//         event.offsetY,
//         card,
//         wrap
//       );
//       wrap.classList.remove("active-tilt"); // Custom class for hover state
//       card.classList.remove("active-tilt"); // Custom class for hover state
//     },
//     [animationHandlers]
//   );

//   const handleDeviceOrientation = useCallback(
//     (event: DeviceOrientationEvent) => {
//       const card = cardRef.current;
//       const wrap = wrapRef.current;

//       if (!card || !wrap || !animationHandlers) return;

//       const { beta, gamma } = event;
//       if (beta === null || gamma === null) return; // Check for null explicitly

//       animationHandlers.updateCardTransform(
//         card.clientHeight / 2 + gamma * mobileTiltSensitivity,
//         card.clientWidth / 2 + (beta - ANIMATION_CONFIG.DEVICE_BETA_OFFSET) * mobileTiltSensitivity,
//         card,
//         wrap
//       );
//     },
//     [animationHandlers, mobileTiltSensitivity]
//   );

//   useEffect(() => {
//     if (!enableTilt || !animationHandlers) return;

//     const card = cardRef.current;
//     const wrap = wrapRef.current;

//     if (!card || !wrap) return;

//     // Type casting for event listeners
//     const pointerMoveHandler = handlePointerMove as EventListener;
//     const pointerEnterHandler = handlePointerEnter as EventListener;
//     const pointerLeaveHandler = handlePointerLeave as EventListener;
//     const deviceOrientationHandler = handleDeviceOrientation as EventListener;

//     const handleClick = () => {
//       if (!enableMobileTilt || typeof window === 'undefined' || location.protocol !== 'https:') return;
//       if (typeof (window.DeviceMotionEvent as any).requestPermission === 'function') {
//         (window.DeviceMotionEvent as any)
//           .requestPermission()
//           .then((state: string) => {
//             if (state === 'granted') {
//               window.addEventListener('deviceorientation', deviceOrientationHandler);
//             }
//           })
//           .catch((err: any) => console.error(err));
//       } else {
//         window.addEventListener('deviceorientation', deviceOrientationHandler);
//       }
//     };

//     card.addEventListener("pointerenter", pointerEnterHandler);
//     card.addEventListener("pointermove", pointerMoveHandler);
//     card.addEventListener("pointerleave", pointerLeaveHandler);
//     card.addEventListener('click', handleClick); // Use click for mobile permission

//     const initialX = wrap.clientWidth - ANIMATION_CONFIG.INITIAL_X_OFFSET;
//     const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;

//     animationHandlers.updateCardTransform(initialX, initialY, card, wrap);
//     animationHandlers.createSmoothAnimation(
//       ANIMATION_CONFIG.INITIAL_DURATION,
//       initialX,
//       initialY,
//       card,
//       wrap
//     );

//     return () => {
//       card.removeEventListener("pointerenter", pointerEnterHandler);
//       card.removeEventListener("pointermove", pointerMoveHandler);
//       card.removeEventListener("pointerleave", pointerLeaveHandler);
//       card.removeEventListener('click', handleClick);
//       window.removeEventListener('deviceorientation', deviceOrientationHandler);
//       animationHandlers.cancelAnimation();
//     };
//   }, [
//     enableTilt,
//     enableMobileTilt,
//     animationHandlers,
//     handlePointerMove,
//     handlePointerEnter,
//     handlePointerLeave,
//     handleDeviceOrientation,
//   ]);

//   // Combined styles for elements that heavily rely on CSS variables
//   // These will be applied directly via the `style` prop.
//   const cardWrapperDynamicStyle = useMemo(
//     () =>
//       ({
//         '--icon': iconUrl ? `url(${iconUrl})` : 'none',
//         '--grain': grainUrl ? `url(${grainUrl})` : 'none',
//         '--behind-gradient': showBehindGradient
//           ? (behindGradient ?? DEFAULT_BEHIND_GRADIENT)
//           : 'none',
//         '--inner-gradient': innerGradient ?? DEFAULT_INNER_GRADIENT,
//         // Card opacity, set by JS based on pointer interaction
//         '--card-opacity': '0', // Initial state, will be updated by JS
//         // These will be dynamically set by JS
//         '--pointer-x': '50%',
//         '--pointer-y': '50%',
//         '--pointer-from-center': '0',
//         '--pointer-from-top': '0.5',
//         '--pointer-from-left': '0.5',
//         '--rotate-x': '0deg',
//         '--rotate-y': '0deg',
//         '--background-x': '50%',
//         '--background-y': '50%',
//         '--card-radius': '30px',
//         '--sunpillar-clr-1': 'hsl(2, 100%, 73%)',
//         '--sunpillar-clr-2': 'hsl(53, 100%, 69%)',
//         '--sunpillar-clr-3': 'hsl(93, 100%, 69%)',
//         '--sunpillar-clr-4': 'hsl(176, 100%, 76%)',
//         '--sunpillar-clr-5': 'hsl(228, 100%, 74%)',
//         '--sunpillar-clr-6': 'hsl(283, 100%, 73%)',
//       }) as React.CSSProperties,
//     [iconUrl, grainUrl, showBehindGradient, behindGradient, innerGradient]
//   );

//   const handleContactClick = useCallback(() => {
//     onContactClick?.();
//   }, [onContactClick]);

//   return (
//     <div
//       ref={wrapRef}
//       className={`relative perspective-500 transform-gpu ${className}`} // Added transform-gpu for better performance
//       style={cardWrapperDynamicStyle}
//     >
//       {/* Pseudo-element for --behind-gradient effect */}
//       {showBehindGradient && (
//         <div
//           className={`absolute inset-[-10px] rounded-[var(--card-radius)] bg-[inherit] bg-no-repeat bg-[position:inherit] transition-all duration-500 ease-in-out filter-none blur-3xl scale-80 transform-gpu
//             before:content-[''] before:absolute before:inset-0 before:bg-[image:var(--behind-gradient)] before:bg-[size:100%_100%] before:rounded-[inherit]
//             active-tilt:filter active-tilt:contrast-[1] active-tilt:saturate-[2] active-tilt:blur-[40px] active-tilt:opacity-100 active-tilt:scale-90`}
//         ></div>
//       )}

//       <section
//         ref={cardRef}
//         className={`relative grid aspect-[0.718] h-[80svh] max-h-[540px] rounded-[var(--card-radius)] overflow-hidden
//           bg-blend-color-dodge bg-no-repeat
//           shadow-[calc(var(--pointer-from-left)*10px-3px)_calc(var(--pointer-from-top)*20px-6px)_20px_-5px_rgba(0,0,0,0.8)]
//           transition-[transform] duration-1000 ease-in-out transform-gpu
//           bg-[size:100%_100%,100%_100%,50%_50%,100%_100%] bg-[position:0_0,0_0,50%_50%,0_0]
//           bg-[image:radial-gradient(farthest-side_circle_at_var(--pointer-x)_var(--pointer-y),_hsla(266,100%,90%,var(--card-opacity))_4%,_hsla(266,50%,80%,calc(var(--card-opacity)*0.75))_10%,_hsla(266,25%,70%,calc(var(--card-opacity)*0.5))_50%,_hsla(266,0%,60%,0)_100%),radial-gradient(35%_52%_at_55%_20%,_#00ffaac4_0%,_#073aff00_100%),radial-gradient(100%_100%_at_50%_50%,_#00c1ffff_1%,_#073aff00_76%),conic-gradient(from_124deg_at_50%_50%,_#c137ffff_0%,_#07c6ffff_40%,_#07c6ffff_60%,_#c137ffff_100%)]
//           active-tilt:transition-none active-tilt:rotate-x-[var(--rotate-y)] active-tilt:rotate-y-[var(--rotate-x)]
//           [animation:glow-bg_12s_linear_infinite]
//           md:h-[70svh] md:max-h-[450px]
//           sm:h-[60svh] sm:max-h-[380px]
//           xs:h-[55svh] xs:max-h-[320px]
//           `}
//       >
//         <div
//           className="absolute inset-[1px] rounded-[var(--card-radius)] bg-[image:var(--inner-gradient)] bg-black/90 transform-gpu [transform:translate3d(0,0,0.01px)]"
//         />

//         <div
//           className={`relative z-30 transform-gpu [transform:translate3d(0,0,1px)] overflow-hidden bg-transparent bg-cover bg-center bg-[image:
//             repeating-linear-gradient(0deg,_var(--sunpillar-clr-1)_calc(var(--space)*1),_var(--sunpillar-clr-2)_calc(var(--space)*2),_var(--sunpillar-clr-3)_calc(var(--space)*3),_var(--sunpillar-clr-4)_calc(var(--space)*4),_var(--sunpillar-clr-5)_calc(var(--space)*5),_var(--sunpillar-clr-6)_calc(var(--space)*6),_var(--sunpillar-clr-1)_calc(var(--space)*7)),
//             repeating-linear-gradient(var(--angle),_#0e152e_0%,_hsl(180,10%,60%)_3.8%,_hsl(180,29%,66%)_4.5%,_hsl(180,10%,60%)_5.2%,_#0e152e_10%,_#0e152e_12%),
//             radial-gradient(farthest-corner_circle_at_var(--pointer-x)_var(--pointer-y),_hsla(0,0%,0%,0.1)_12%,_hsla(0,0%,0%,0.15)_20%,_hsla(0,0%,0%,0.25)_120%)]
//             bg-[position:0_var(--background-y),_var(--background-x)_var(--background-y),_center]
//             bg-blend-color_hard-light
//             bg-[size:500%_500%,_300%_300%,_200%_200%] bg-repeat
//             [mask-image:var(--icon)] [mask-mode:luminance] [mask-repeat:repeat] [mask-size:150%] [mask-position:top_calc(200%-var(--background-y)*5)_left_calc(100%-var(--background-x))]
//             transition-[filter] duration-600 ease-in-out filter-brightness-[0.66] contrast-[1.33] saturate-[0.33] opacity-50 mix-blend-color-dodge
//             active-tilt:filter-brightness-[0.85] active-tilt:contrast-[1.5] active-tilt:saturate-[0.5] active-tilt:animate-none
//             [animation:holo-bg_18s_linear_infinite]
//             [&>*]:grid [&>*]:grid-area-1/-1 [&>*]:rounded-[var(--card-radius)] [&>*]:transform-gpu [&>*]:[transform:translate3d(0,0,0.1px)] [&>*]:pointer-events-none
//             `}
//         >
//           {/* ::before for pc-shine */}
//           <div
//             className={`opacity-0
//               active-tilt:opacity-100
//               before:content-[''] before:absolute before:inset-0 before:bg-[image:linear-gradient(45deg,_var(--sunpillar-4),_var(--sunpillar-5),_var(--sunpillar-6),_var(--sunpillar-1),_var(--sunpillar-2),_var(--sunpillar-3)),_radial-gradient(circle_at_var(--pointer-x)_var(--pointer-y),_hsl(0,0%,70%)_0%,_hsla(0,0%,30%,0.2)_90%),_var(--grain)]
//               before:bg-[size:250%_250%,_100%_100%,_220px_220px]
//               before:bg-[position:var(--pointer-x)_var(--pointer-y),_center,_calc(var(--pointer-x)*0.01)_calc(var(--pointer-y)*0.01)]
//               before:bg-blend-color-dodge
//               before:filter-brightness-[calc(2-var(--pointer-from-center))] before:contrast-[calc(var(--pointer-from-center)+2)] before:saturate-[calc(0.5+var(--pointer-from-center))]
//               before:mix-blend-luminosity`}
//           />
//           {/* ::after for pc-shine */}
//           <div
//             className={`opacity-0
//               active-tilt:opacity-100
//               after:content-[''] after:absolute after:inset-0 after:bg-[position:0_var(--background-y),_calc(var(--background-x)*0.4)_calc(var(--background-y)*0.5),_center]
//               after:bg-[size:200%_300%,_700%_700%,_100%_100%]
//               after:mix-blend-difference
//               after:filter-brightness-[0.8] after:contrast-[1.5]`}
//           />
//         </div>

//         <div
//           className={`relative z-40 transform-gpu [transform:translate3d(0,0,1.1px)] overflow-hidden
//             bg-[image:radial-gradient(farthest-corner_circle_at_var(--pointer-x)_var(--pointer-y),_hsl(248,25%,80%)_12%,_hsla(207,40%,30%,0.8)_90%)]
//             mix-blend-overlay filter-brightness-[0.8] filter-contrast-[1.2]`}
//         />

//         <div
//           className={`mix-blend-screen overflow-hidden text-center relative
//             transform-gpu [transform:translate3d(calc(var(--pointer-from-left)*-6px+3px),calc(var(--pointer-from-top)*-6px+3px),0.1px)]
//             z-50 `}
//         >
//           {/* Avatar content */}
//           <img
//             className="w-full absolute left-1/2 -translate-x-1/2 scale-100 bottom-[2px]"
//             style={{ opacity: `calc(1.75 - var(--pointer-from-center))` }}
//             src={avatarUrl}
//             alt={`${name || "User"} avatar`}
//             loading="lazy"
//             onError={(e) => {
//               const target = e.target as HTMLImageElement;
//               target.style.display = "none";
//             }}
//           />
//           {/* Avatar content ::before backdrop blur */}
//           <div
//             className={`absolute inset-0 z-10 backdrop-blur-30 pointer-events-none
//               [mask-image:linear-gradient(to_bottom,_rgba(0,0,0,0)_0%,_rgba(0,0,0,0)_60%,_rgba(0,0,0,1)_90%,_rgba(0,0,0,1)_100%)]`}
//           />

//           {showUserInfo && (
//             <div
//               className={`absolute bottom-5 left-5 right-5 z-20 flex items-center justify-between
//                 bg-white/10 backdrop-blur-30 border border-white/10 rounded-[15px] p-3.5 pointer-events-auto
//                 md:bottom-[15px] md:left-[15px] md:right-[15px] md:p-[10px_12px]
//                 sm:bottom-[12px] sm:left-[12px] sm:right-[12px] sm:p-[8px_10px] sm:rounded-full
//                 xs:bottom-[12px] xs:left-[12px] xs:right-[12px] xs:p-[8px_10px] xs:rounded-full`}
//             >
//               <div className="flex items-center gap-3 md:gap-2.5 sm:gap-2">
//                 <div
//                   className={`w-12 h-12 rounded-full overflow-hidden border border-white/10 flex-shrink-0
//                     md:w-7 md:h-7 sm:w-6 sm:h-6 xs:w-5 xs:h-5`}
//                 >
//                   <img
//                     src={miniAvatarUrl || avatarUrl}
//                     alt={`${name || "User"} mini avatar`}
//                     loading="lazy"
//                     className="w-full h-full object-cover rounded-full"
//                     onError={(e) => {
//                       const target = e.target as HTMLImageElement;
//                       target.style.opacity = "0.5";
//                       target.src = avatarUrl;
//                     }}
//                   />
//                 </div>
//                 <div className="flex flex-col items-start gap-1.5 sm:gap-1">
//                   <div className="text-sm font-medium text-white/90 leading-none md:text-[13px] sm:text-[12px] xs:text-[11px]">
//                     @{handle}
//                   </div>
//                   <div className="text-sm text-white/70 leading-none md:text-[10px] sm:text-[9px] xs:text-[8px]">
//                     {status}
//                   </div>
//                 </div>
//               </div>
//               <button
//                 className={`border border-white/10 rounded-lg px-4 py-2 text-sm font-semibold text-white/90 cursor-pointer
//                   transition-all duration-200 ease-in-out backdrop-blur-[10px] pointer-events-auto
//                   hover:border-white/40 hover:-translate-y-px
//                   md:px-3 md:py-1.5 md:text-[11px]
//                   sm:px-2.5 sm:py-1 sm:text-[10px] sm:rounded-full
//                   xs:px-2 sm:py-1 xs:text-[9px] xs:rounded-full`}
//                 onClick={handleContactClick}
//                 type="button"
//                 aria-label={`Contact ${name || "user"}`}
//               >
//                 {contactText}
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Details content */}
//         <div
//           className={`max-h-full overflow-hidden text-center relative
//             transform-gpu [transform:translate3d(calc(var(--pointer-from-left)*-6px+3px),calc(var(--pointer-from-top)*-6px+3px),0.1px)]
//             z-50
//             `}
//         >
//           <div className="w-full absolute top-[3em] flex flex-col md:top-[2em] sm:top-[1.5em]">
//             <h3
//               className={`font-semibold text-[min(5svh,3em)] m-0 bg-gradient-to-b from-white to-[#6f6fbe]
//                 bg-[size:1em_1.5em] bg-clip-text text-transparent
//                 md:text-[min(4svh,2.5em)] sm:text-[min(3.5svh,2em)] xs:text-[min(3svh,1.5em)]`}
//             >
//               {name}
//             </h3>
//             <p
//               className={`font-semibold relative -top-3 whitespace-nowrap text-base mx-auto w-min
//                 bg-gradient-to-b from-white to-[#4a4ac0] bg-[size:1em_1.5em] bg-clip-text text-transparent
//                 md:text-sm sm:text-xs sm:-top-2 xs:text-[11px]`}
//             >
//               {title}
//             </p>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// };

// const ProfileCard = React.memo(ProfileCardComponent);

// export default ProfileCard;