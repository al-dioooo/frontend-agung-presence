type Props = {
    className?: string
    strokeWidth?: number
}

export const HomeIcon = ({ className, strokeWidth = 0 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"currentColor"} viewBox={"0 0 24 24"}>
            <path d="M3 13h1v7c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-7h1c.4 0 .77-.24.92-.62.15-.37.07-.8-.22-1.09l-8.99-9a.996.996 0 0 0-1.41 0l-9.01 9c-.29.29-.37.72-.22 1.09s.52.62.92.62Zm9-8.59 6 6V20H6v-9.59z"></path>
        </svg>
    )
}

export const DatabaseIcon = ({ className, strokeWidth = 0 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"currentColor"} viewBox={"0 0 24 24"}>
            <path d="M12 3C7.66 3 4 4.83 4 7v10c0 2.17 3.66 4 8 4s8-1.83 8-4V7c0-2.17-3.66-4-8-4m0 2c3.68 0 5.91 1.49 6 2-.09.51-2.32 2-6 2S6.07 7.49 6 7.01C6.07 6.51 8.31 5 12 5M6 9.61c1.48.85 3.64 1.39 6 1.39s4.52-.55 6-1.39V12c-.07.5-2.31 2-6 2s-5.93-1.51-6-2zM12 19c-3.69 0-5.93-1.51-6-2v-2.39c1.48.85 3.64 1.39 6 1.39s4.52-.55 6-1.39V17c-.07.5-2.31 2-6 2"></path>
        </svg>
    )
}

export const EnterpriseIcon = ({ className, strokeWidth = 0 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"currentColor"} viewBox={"0 0 24 24"}>
            <path d="M21 6h-4V4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v3.38L2.11 9.83A2 2 0 0 0 1 11.62V21c0 .55.45 1 1 1h20c.55 0 1-.45 1-1V8c0-1.1-.9-2-2-2m0 14H7v-8.01L5 13v7H3v-8.38L8.45 8.9A1 1 0 0 0 9 8.01v-4h6v3c0 .55.45 1 1 1h5v12Z"></path><path d="M11 10h2v2h-2zm0 4h2v2h-2zm0-8h2v2h-2zm6 8h2v2h-2zm0-4h2v2h-2z"></path>
        </svg>
    )
}

export const UserIcon = ({ className, strokeWidth = 0 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"currentColor"} viewBox={"0 0 24 24"}>
            <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5m0-8c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3M4 22h16c.55 0 1-.45 1-1v-1c0-3.86-3.14-7-7-7h-4c-3.86 0-7 3.14-7 7v1c0 .55.45 1 1 1m6-7h4c2.76 0 5 2.24 5 5H5c0-2.76 2.24-5 5-5"></path>
        </svg>
    )
}

export const CommunityIcon = ({ className, strokeWidth = 0 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"currentColor"} viewBox={"0 0 24 24"}>
            <path d="M12 11c1.71 0 3-1.29 3-3s-1.29-3-3-3-3 1.29-3 3 1.29 3 3 3m0-4c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1m1 5h-2c-2.76 0-5 2.24-5 5v.5c0 .83.67 1.5 1.5 1.5h9c.83 0 1.5-.67 1.5-1.5V17c0-2.76-2.24-5-5-5m-5 5c0-1.65 1.35-3 3-3h2c1.65 0 3 1.35 3 3zm-1.5-6c.47 0 .9-.12 1.27-.33a5.03 5.03 0 0 1-.42-4.52C7.09 6.06 6.8 6 6.5 6 5.06 6 4 7.06 4 8.5S5.06 11 6.5 11m-.39 1H5.5C3.57 12 2 13.57 2 15.5v1c0 .28.22.5.5.5H4c0-1.96.81-3.73 2.11-5m11.39-1c1.44 0 2.5-1.06 2.5-2.5S18.94 6 17.5 6c-.31 0-.59.06-.85.15a5.03 5.03 0 0 1-.42 4.52c.37.21.79.33 1.27.33m1 1h-.61A6.97 6.97 0 0 1 20 17h1.5c.28 0 .5-.22.5-.5v-1c0-1.93-1.57-3.5-3.5-3.5"></path>
        </svg>
    )
}

export const SearchIcon = ({ className, strokeWidth = 2 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6 -6" />
        </svg>
    )
}

export const FilterIcon = ({ className, strokeWidth = 2 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 12h10" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 18h4" />
        </svg>
    )
}

export const ChevronBackIcon = ({ className, strokeWidth = 2 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6l6 6" />
        </svg>
    )
}

export const DotsIcon = ({ className, strokeWidth = 2 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
        </svg>
    )
}

export const MapPinIcon = ({ className, strokeWidth = 2 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" />
        </svg>
    )
}

export const EyeIcon = ({ className, strokeWidth = 2 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
        </svg>
    )
}

export const EyeSlashIcon = ({ className, strokeWidth = 0 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
    )
}

export const ChevronLeftIcon = ({ className, strokeWidth = 0 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
    )
}

export const ChevronRightIcon = ({ className, strokeWidth = 0 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
    )
}

export const ChevronDownIcon = ({ className, strokeWidth = 0 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
    )
}

export const UploadIcon = ({ className, strokeWidth = 0 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
    )
}

export const DownloadIcon = ({ className, strokeWidth = 0 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5 0L12 21m0 0l4.5-4.5M12 21V7.5" />
        </svg>
    )
}

export const PencilIcon = ({ className, strokeWidth = 2 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.5l4 4" />
        </svg>
    )
}

export const TrashIcon = ({ className, strokeWidth = 2 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7l16 0" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 11l0 6" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 11l0 6" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
        </svg>
    )
}

export const ExpandIcon = ({ className, strokeWidth = 2 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V6a2 2 0 0 1 2 -2h2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 0 0 2 2h2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 4h2a2 2 0 0 1 2 2v2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 20h2a2 2 0 0 0 2 -2v-2" />
        </svg>
    )
}

export const CollapseIcon = ({ className, strokeWidth = 2 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 9h4V5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15h4v4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9h-4V5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19v-4h4" />
        </svg>
    )
}

export const MailIcon = ({ className, strokeWidth = 2 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8l-9 6-9-6" />
        </svg>
    )
}

export const ClockDownIcon = ({ className, strokeWidth = 2 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.984 12.535a9 9 0 1 0 -8.431 8.448" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 16v6" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M22 19l-3 3l-3 -3" />
        </svg>
    )
}

export const ClockUpIcon = ({ className, strokeWidth = 2 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.983 12.548a9 9 0 1 0 -8.45 8.436" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 22v-6" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M22 19l-3 -3l-3 3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l2.5 2.5" />
        </svg>
    )
}

export const CurrentLocationIcon = ({ className, strokeWidth = 2 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 1 0 16 0a8 8 0 1 0 -16 0" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l0 2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20l0 2" />
            <path d="M20 12l2 0" />
            <path d="M2 12l2 0" />
        </svg>
    )
}

export const CameraIcon = ({ className, strokeWidth = 2 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 7h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
        </svg>
    )
}

export const SwitchCameraIcon = ({ className, strokeWidth = 2 }: Props) => {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width={24} height={24} strokeWidth={strokeWidth} fill={"none"} stroke={"currentColor"} viewBox={"0 0 24 24"}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h1.5a2 2 0 0 0 1.79 -1.11l.42 -.78a2 2 0 0 1 1.79 -1.11h3a2 2 0 0 1 1.79 1.11l.42 .78a2 2 0 0 0 1.79 1.11h1.5a2 2 0 0 1 2 2v7a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-7a2 2 0 0 1 2 -2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 11a5 5 0 0 1 7.5 -3.9" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 7.1h-2.4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 7.1v-2.4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 15a5 5 0 0 1 -7.5 3.9" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 18.9h2.4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 18.9v2.4" />
        </svg>
    )
}
