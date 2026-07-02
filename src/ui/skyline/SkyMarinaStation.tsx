interface Props {
  x?: number
  y?: number
  scale?: number
  opacity?: number
}

export function SkyMarinaStation({ x = 0, y = 0, scale = 1, opacity = 1 }: Props) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
      <rect x="337" y="87.9932" width="9" height="74" fill="#D3E0E4"/>
      <rect x="494" y="87.9932" width="9" height="74" fill="#D3E0E4"/>
      <rect x="651" y="87.9932" width="9" height="74" fill="#D3E0E4"/>
      <rect x="331" y="87.9932" width="21" height="7" fill="#BCC9CE"/>
      <rect x="488" y="87.9932" width="21" height="7" fill="#BCC9CE"/>
      <rect x="645" y="87.9932" width="21" height="7" fill="#BCC9CE"/>
      <rect x="0" y="79" width="1522" height="12" fill="#D3E0E4"/>
      <rect x="91" y="42.9941" width="7" height="119" fill="#D3E0E4"/>
      <rect x="120" y="42.9941" width="8" height="119" fill="#D3E0E4"/>
      <rect x="150" y="42.9941" width="8" height="119" fill="#D3E0E4"/>
      <rect x="0" y="35.1602" width="69" height="133.609" fill="#D3E0E4"/>
      <rect x="0" y="14.9941" width="5" height="20" fill="#D3E0E4"/>
      <rect x="17" y="14.9941" width="5" height="20" fill="#D3E0E4"/>
      <rect x="34" y="14.9941" width="5" height="20" fill="#D3E0E4"/>
      <rect x="51" y="14.9941" width="5" height="20" fill="#D3E0E4"/>
      <rect x="68" y="14.9941" width="5" height="20" fill="#D3E0E4"/>
      <rect x="85" y="14.9941" width="5" height="20" fill="#D3E0E4"/>
      <rect x="102" y="14.9941" width="5" height="20" fill="#D3E0E4"/>
      <rect x="119" y="14.9941" width="5" height="20" fill="#D3E0E4"/>
      <rect x="136" y="14.9941" width="5" height="20" fill="#D3E0E4"/>
      <rect x="153" y="14.9941" width="5" height="20" fill="#D3E0E4"/>
      <rect x="0" y="35.1602" width="158" height="18.0825" fill="#D3E0E4"/>
      <rect x="0" y="36.165" width="158" height="3.01375" fill="#02C27F"/>
      <rect x="5" y="52.2383" width="58" height="37.1695" fill="#A6BEC5"/>
      <rect x="5" y="53.2432" width="57" height="35.1604" fill="#A9CEDA"/>
      <rect x="6" y="91.417" width="25" height="40.1833" fill="#A6BEC5"/>
      <rect x="5" y="92.4219" width="25" height="38.1741" fill="#A9CEDA"/>
      <rect x="46" y="91.417" width="27" height="40.1833" fill="#A6BEC5"/>
      <rect x="47" y="92.4219" width="25" height="38.1741" fill="#A9CEDA"/>
      <rect x="31" y="94.9941" width="15" height="6" fill="#517A70"/>
      <rect x="31" y="110.994" width="15" height="6" fill="#517A70"/>
      <rect x="0" y="0" width="161" height="18.0825" fill="#D3E0E4"/>
      <path d="M51.5 88.9941V126.994M59.5 88.9941V126.994M67.5 88.9941V126.994M47 96.4941H72M47 104.494H72M47 112.494H72M47 120.494H72" stroke="#73B1C6" fill="none"/>
      <path d="M9.5 88.9941V126.994M17.5 88.9941V126.994M25.5 88.9941V126.994M5 96.4941H30M5 104.494H30M5 112.494H30M5 120.494H30" stroke="#73B1C6" fill="none"/>
    </g>
  )
}
