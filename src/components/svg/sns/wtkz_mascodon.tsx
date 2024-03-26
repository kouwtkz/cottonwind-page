import { SVGAttributes } from "react";

export default function MenuButton({
  className,
  ...attributes
}: SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...attributes}
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M18 36C27.9411 36 36 27.9411 36 18C36 8.05887 27.9411 0 18 0C8.05887 0 0 8.05887 0 18C0 27.9411 8.05887 36 18 36ZM28.6558 11.8051L28.6558 11.8051C28.2705 12.1904 27.8852 12.5757 27.2711 12.7322C29.1396 13.4246 29.9369 13.8044 31.4882 14.8281C32.9384 15.7851 34.3886 16.7421 33.9052 18.1776C33.4218 19.6132 31.7682 20.7336 30.0324 20.7336C30.0026 22.1812 29.8961 24.6077 29.529 26.4905C29.1737 28.3133 26.3468 30.3081 23.1002 30.6947C21.4072 30.8961 20.2287 31 17.9629 31C16.0193 31 14.9027 30.9028 13.1189 30.6947C9.80701 30.3081 6.92332 28.3133 6.56088 26.4905C6.18641 24.6077 6.07776 22.1812 6.04733 20.7336C4.2767 20.7336 2.58985 19.6132 2.09673 18.1776C1.60361 16.7421 3.08296 15.7851 4.56232 14.8281C6.04379 13.8697 6.85118 13.4757 8.51209 12.8612C8.04707 12.6739 7.72087 12.3477 7.39468 12.0215L7.39466 12.0215C6.11991 10.7467 5.73223 8.13947 7.5 6.49999C9.26776 4.86052 12.3586 4.90235 13.5 6C14.6414 7.09765 15.234 8.13005 15 11C14.9987 11.0163 14.9969 11.0325 14.9947 11.0488C15.8711 11.0056 16.8475 11 18.0017 11C19.1457 11 20.1878 11.0345 21.1363 11.1058C21.0889 11.0009 21.0594 10.8933 21.0505 10.7837C20.8165 7.91371 21.4091 6.88131 22.5505 5.78366C23.6919 4.68601 26.7827 4.64418 28.5505 6.28365C30.3183 7.92313 29.9306 10.5304 28.6558 11.8051ZM24.5632 12.0614L24.6361 11.9956C25.2938 11.4025 25.6663 11.0666 25.85 10.55C25.9023 10.4028 26.0432 9.88994 26.027 9.83761C25.985 9.70168 25.4127 9.6858 25.3836 9.83763C25.3512 10.0071 25.2505 10.1972 25.1517 10.3838C25.1221 10.4397 25.0926 10.4953 25.0652 10.55C24.9598 10.7603 23.998 11.5862 23.6862 11.8539L23.6862 11.8539L23.6861 11.854L23.6861 11.854C23.6467 11.8878 23.6177 11.9127 23.6021 11.9264C23.5643 11.9594 23.5588 12.1708 23.6021 12.2C23.8813 12.3885 24.7356 12.8178 25.3836 12.839C25.5461 12.8443 25.7216 12.8426 25.8498 12.75C25.9781 12.6574 25.642 12.5169 25.5 12.5C25.1165 12.4544 24.4639 12.151 24.5632 12.0614ZM11.3923 11.996L11.4651 12.0618C11.5644 12.1514 10.9118 12.4547 10.5283 12.5004C10.3863 12.5173 10.0502 12.6578 10.1785 12.7504C10.3068 12.843 10.4822 12.8447 10.6447 12.8394C11.2927 12.8182 12.147 12.3889 12.4262 12.2004C12.4696 12.1711 12.464 11.9598 12.4262 11.9267C12.4106 11.9131 12.3816 11.8882 12.3422 11.8544L12.3422 11.8544L12.3422 11.8544C12.0304 11.5867 11.0685 10.7607 10.9631 10.5504C10.9357 10.4957 10.9062 10.4401 10.8766 10.3842L10.8766 10.3842L10.8766 10.3841C10.7778 10.1976 10.6771 10.0074 10.6447 9.83801C10.6156 9.68618 10.0433 9.70206 10.0013 9.83799C9.98512 9.89032 10.126 10.4032 10.1783 10.5504C10.362 11.067 10.7345 11.4029 11.3923 11.996ZM26.0115 20.3189V27.4109H23.2225V20.5274C23.2225 19.0763 22.6164 18.3398 21.4042 18.3398C20.0639 18.3398 19.3921 19.2135 19.3921 20.9411V24.7088H16.6195V20.9411C16.6195 19.2135 15.9476 18.3398 14.6073 18.3398C13.3951 18.3398 12.7891 19.0763 12.7891 20.5274V27.4109H10V20.3189C10 18.8695 10.3663 17.7176 11.1022 16.8655C11.861 16.0133 12.8548 15.5765 14.0884 15.5765C15.5156 15.5765 16.5964 16.1291 17.3111 17.2345L18.0058 18.4077L18.7006 17.2345C19.4151 16.1291 20.4959 15.5765 21.9233 15.5765C23.1568 15.5765 24.1505 16.0133 24.9095 16.8655C25.6452 17.7176 26.0115 18.8695 26.0115 20.3189Z"
        fill="black"
      />
    </svg>
  );
}
