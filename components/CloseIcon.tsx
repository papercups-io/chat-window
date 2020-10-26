/** @jsx jsx */
import {jsx} from 'theme-ui';

const CloseIcon = ({
  width,
  height,
  className,
  onClick,
}: {
  width?: number;
  height?: number;
  className?: string;
  onClick?: (e: any) => void;
}) => {
  return (
    <svg
      height={height || 27}
      width={width || 27}
      viewBox="0 0 27 27"
      className={className}
      onClick={onClick}
    >
      <path
        fill="transparent"
        strokeWidth={2}
        stroke="hsl(0, 0%, 99%)"
        strokeLinecap="round"
        d="M 7 7 L 20 20"
      ></path>
      <path
        fill="transparent"
        strokeWidth={2}
        stroke="hsl(0, 0%, 99%)"
        strokeLinecap="round"
        d="M 7 20 L 20 7"
      ></path>
    </svg>
  );
};

export default CloseIcon;
