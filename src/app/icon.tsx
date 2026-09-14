import { portraitIcon } from "@/lib/portrait-icon";

export const size = { width: 256, height: 256 };
export const contentType = "image/png";

export default function Icon() {
  return portraitIcon(size.width);
}
