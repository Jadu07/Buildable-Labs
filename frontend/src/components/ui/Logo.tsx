import { cn } from '../../utils/cn';

interface LogoProps {
  className?: string;
  imageClassName?: string;
}

export function Logo({ className, imageClassName }: LogoProps) {
  return (
    <div className={cn('flex items-center', className)}>
      <div 
        className={cn('h-7 aspect-[956/194] bg-[#2B4C7E] dark:bg-[#3E6AE1] transition-colors', imageClassName)}
        style={{
          WebkitMaskImage: 'url(/typespace-logo.png)',
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center left',
          maskImage: 'url(/typespace-logo.png)',
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center left'
        }}
        role="img"
        aria-label="Typespace Logo"
      />
    </div>
  );
}
