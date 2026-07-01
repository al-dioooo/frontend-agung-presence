import { BottomSheet } from "@/app/components/bottom-sheet";

type ResponsiveSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function ResponsiveSheet(props: ResponsiveSheetProps) {
  return <BottomSheet {...props} />;
}
