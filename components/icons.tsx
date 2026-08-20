import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const Base = ({ children, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    {children}
  </svg>
);

export const SparkIcon = (props: IconProps) => (
  <Base {...props}><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z"/><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z"/></Base>
);

export const UploadIcon = (props: IconProps) => (
  <Base {...props}><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/></Base>
);

export const DownloadIcon = (props: IconProps) => (
  <Base {...props}><path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/></Base>
);

export const PlusIcon = (props: IconProps) => (
  <Base {...props}><path d="M12 5v14M5 12h14"/></Base>
);

export const TrashIcon = (props: IconProps) => (
  <Base {...props}><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13"/></Base>
);

export const ChevronIcon = (props: IconProps) => (
  <Base {...props}><path d="m8 10 4 4 4-4"/></Base>
);

export const FileIcon = (props: IconProps) => (
  <Base {...props}><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></Base>
);

export const CheckIcon = (props: IconProps) => (
  <Base {...props}><path d="m5 12 4 4L19 6"/></Base>
);

export const ExternalIcon = (props: IconProps) => (
  <Base {...props}><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v7H4V6h7"/></Base>
);

export const ResetIcon = (props: IconProps) => (
  <Base {...props}><path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/></Base>
);
