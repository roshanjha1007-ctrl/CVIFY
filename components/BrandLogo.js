import Image from 'next/image'

export default function BrandLogo({
  compact = false,
  className = '',
  priority = false,
}) {
  if (compact) {
    return (
      <Image
        src="/cvify-mark.svg"
        alt="CVIFY"
        width={44}
        height={44}
        priority={priority}
        className={className}
      />
    )
  }

  return (
    <Image
      src="/cvify-logo.svg"
      alt="CVIFY"
      width={452}
      height={132}
      priority={priority}
      className={className}
    />
  )
}
