/* Talk to it — the browser voice widget.
   One script tag gives any page the bubble, the panel and the orb:
     <script type="module" src="/talk.js"></script>
   Anything with data-vc-talk opens it; data-vc-talk="start" also places the
   call. The hero orb and the nav button are both just that attribute. */

const FIELD = '<g stroke="#5B7CC4" stroke-width="0.6" fill="none"><line x1="188.5" y1="128.6" x2="201.6" y2="130.9" opacity="0.16"/><line x1="188.5" y1="128.6" x2="186.9" y2="113.2" opacity="0.17"/><line x1="188.8" y1="144.8" x2="186.0" y2="154.9" opacity="0.23"/><line x1="188.8" y1="144.8" x2="203.3" y2="144.2" opacity="0.16"/><line x1="188.8" y1="144.8" x2="198.6" y2="160.7" opacity="0.10"/><line x1="186.0" y1="154.9" x2="198.6" y2="160.7" opacity="0.14"/><line x1="186.0" y1="154.9" x2="179.3" y2="172.8" opacity="0.13"/><line x1="186.0" y1="154.9" x2="203.3" y2="144.2" opacity="0.10"/><line x1="179.3" y1="172.8" x2="189.5" y2="178.5" opacity="0.19"/><line x1="179.3" y1="172.8" x2="166.8" y2="185.4" opacity="0.15"/><line x1="166.8" y1="185.4" x2="168.5" y2="188.1" opacity="0.24"/><line x1="166.8" y1="185.4" x2="153.0" y2="195.6" opacity="0.11"/><line x1="146.8" y1="185.0" x2="139.9" y2="187.3" opacity="0.28"/><line x1="139.9" y1="187.3" x2="141.6" y2="201.7" opacity="0.17"/><line x1="139.9" y1="187.3" x2="153.0" y2="195.6" opacity="0.13"/><line x1="139.9" y1="187.3" x2="125.2" y2="192.6" opacity="0.18"/><line x1="125.2" y1="192.6" x2="121.5" y2="200.0" opacity="0.20"/><line x1="125.2" y1="192.6" x2="109.6" y2="197.2" opacity="0.15"/><line x1="125.2" y1="192.6" x2="109.2" y2="183.7" opacity="0.14"/><line x1="109.2" y1="183.7" x2="109.6" y2="197.2" opacity="0.18"/><line x1="109.2" y1="183.7" x2="93.9" y2="179.5" opacity="0.17"/><line x1="109.2" y1="183.7" x2="93.4" y2="194.1" opacity="0.09"/><line x1="93.9" y1="179.5" x2="83.2" y2="184.3" opacity="0.16"/><line x1="93.9" y1="179.5" x2="85.4" y2="170.1" opacity="0.23"/><line x1="85.4" y1="170.1" x2="75.5" y2="161.1" opacity="0.22"/><line x1="85.4" y1="170.1" x2="83.2" y2="184.3" opacity="0.14"/><line x1="85.4" y1="170.1" x2="69.7" y2="180.3" opacity="0.10"/><line x1="75.5" y1="161.1" x2="66.5" y2="157.8" opacity="0.23"/><line x1="75.5" y1="161.1" x2="71.4" y2="142.5" opacity="0.13"/><line x1="75.5" y1="161.1" x2="69.7" y2="180.3" opacity="0.08"/><line x1="65.4" y1="130.7" x2="67.3" y2="118.8" opacity="0.23"/><line x1="65.4" y1="130.7" x2="53.4" y2="133.6" opacity="0.19"/><line x1="65.4" y1="130.7" x2="60.0" y2="116.9" opacity="0.17"/><line x1="67.3" y1="118.8" x2="60.0" y2="116.9" opacity="0.25"/><line x1="67.3" y1="118.8" x2="53.4" y2="133.6" opacity="0.10"/><line x1="78.3" y1="99.3" x2="84.4" y2="88.7" opacity="0.23"/><line x1="78.3" y1="99.3" x2="61.2" y2="95.2" opacity="0.13"/><line x1="84.4" y1="88.7" x2="68.4" y2="88.7" opacity="0.12"/><line x1="93.7" y1="77.8" x2="97.4" y2="64.2" opacity="0.18"/><line x1="93.7" y1="77.8" x2="107.6" y2="66.9" opacity="0.15"/><line x1="107.6" y1="66.9" x2="97.4" y2="64.2" opacity="0.21"/><line x1="107.6" y1="66.9" x2="121.3" y2="66.9" opacity="0.20"/><line x1="121.3" y1="66.9" x2="119.6" y2="59.7" opacity="0.24"/><line x1="121.3" y1="66.9" x2="134.3" y2="72.0" opacity="0.20"/><line x1="134.3" y1="72.0" x2="148.2" y2="73.4" opacity="0.22"/><line x1="134.3" y1="72.0" x2="141.2" y2="57.1" opacity="0.14"/><line x1="148.2" y1="73.4" x2="149.1" y2="56.9" opacity="0.14"/><line x1="148.2" y1="73.4" x2="141.2" y2="57.1" opacity="0.13"/><line x1="161.9" y1="77.4" x2="169.1" y2="67.4" opacity="0.19"/><line x1="161.9" y1="77.4" x2="180.2" y2="71.6" opacity="0.10"/><line x1="181.0" y1="88.7" x2="187.7" y2="98.3" opacity="0.22"/><line x1="181.0" y1="88.7" x2="192.8" y2="83.0" opacity="0.15"/><line x1="181.0" y1="88.7" x2="192.8" y2="98.0" opacity="0.16"/><line x1="187.7" y1="98.3" x2="192.8" y2="98.0" opacity="0.26"/><line x1="187.7" y1="98.3" x2="192.8" y2="83.0" opacity="0.12"/><line x1="186.9" y1="113.2" x2="192.8" y2="98.0" opacity="0.14"/><line x1="186.9" y1="113.2" x2="204.7" y2="110.2" opacity="0.12"/><line x1="186.9" y1="113.2" x2="201.6" y2="130.9" opacity="0.07"/><line x1="201.6" y1="130.9" x2="203.3" y2="144.2" opacity="0.16"/><line x1="201.6" y1="130.9" x2="218.5" y2="128.1" opacity="0.07"/><line x1="203.3" y1="144.2" x2="198.6" y2="160.7" opacity="0.11"/><line x1="198.6" y1="160.7" x2="214.1" y2="166.5" opacity="0.08"/><line x1="198.6" y1="160.7" x2="201.2" y2="178.1" opacity="0.09"/><line x1="189.5" y1="178.5" x2="179.7" y2="183.5" opacity="0.19"/><line x1="189.5" y1="178.5" x2="201.2" y2="178.1" opacity="0.13"/><line x1="179.7" y1="183.5" x2="168.5" y2="188.1" opacity="0.16"/><line x1="179.7" y1="183.5" x2="190.5" y2="192.8" opacity="0.12"/><line x1="168.5" y1="188.1" x2="153.0" y2="195.6" opacity="0.11"/><line x1="168.5" y1="188.1" x2="175.3" y2="204.9" opacity="0.09"/><line x1="168.5" y1="188.1" x2="190.5" y2="192.8" opacity="0.06"/><line x1="153.0" y1="195.6" x2="141.6" y2="201.7" opacity="0.15"/><line x1="153.0" y1="195.6" x2="138.4" y2="212.8" opacity="0.04"/><line x1="153.0" y1="195.6" x2="159.5" y2="217.3" opacity="0.05"/><line x1="141.6" y1="201.7" x2="138.4" y2="212.8" opacity="0.11"/><line x1="141.6" y1="201.7" x2="121.5" y2="200.0" opacity="0.09"/><line x1="141.6" y1="201.7" x2="159.5" y2="217.3" opacity="0.04"/><line x1="121.5" y1="200.0" x2="138.4" y2="212.8" opacity="0.05"/><line x1="121.5" y1="200.0" x2="126.8" y2="220.9" opacity="0.06"/><line x1="109.6" y1="197.2" x2="100.0" y2="213.3" opacity="0.08"/><line x1="93.4" y1="194.1" x2="74.9" y2="195.7" opacity="0.08"/><line x1="83.2" y1="184.3" x2="69.7" y2="180.3" opacity="0.14"/><line x1="69.7" y1="180.3" x2="56.2" y2="182.6" opacity="0.11"/><line x1="66.5" y1="157.8" x2="49.0" y2="164.5" opacity="0.08"/><line x1="66.5" y1="157.8" x2="55.0" y2="142.0" opacity="0.10"/><line x1="66.5" y1="157.8" x2="43.7" y2="148.9" opacity="0.04"/><line x1="55.0" y1="142.0" x2="53.4" y2="133.6" opacity="0.20"/><line x1="55.0" y1="142.0" x2="38.3" y2="127.4" opacity="0.05"/><line x1="53.4" y1="133.6" x2="38.3" y2="127.4" opacity="0.09"/><line x1="53.4" y1="133.6" x2="60.0" y2="116.9" opacity="0.13"/><line x1="60.0" y1="116.9" x2="39.8" y2="110.0" opacity="0.05"/><line x1="60.0" y1="116.9" x2="48.4" y2="98.7" opacity="0.05"/><line x1="60.0" y1="116.9" x2="61.2" y2="95.2" opacity="0.08"/><line x1="61.2" y1="95.2" x2="48.4" y2="98.7" opacity="0.10"/><line x1="61.2" y1="95.2" x2="54.4" y2="81.7" opacity="0.12"/><line x1="68.4" y1="88.7" x2="78.5" y2="79.9" opacity="0.14"/><line x1="68.4" y1="88.7" x2="48.4" y2="98.7" opacity="0.05"/><line x1="78.5" y1="79.9" x2="66.5" y2="66.0" opacity="0.07"/><line x1="78.5" y1="79.9" x2="97.4" y2="64.2" opacity="0.06"/><line x1="97.4" y1="64.2" x2="112.0" y2="59.6" opacity="0.13"/><line x1="97.4" y1="64.2" x2="101.7" y2="46.8" opacity="0.09"/><line x1="97.4" y1="64.2" x2="88.0" y2="47.4" opacity="0.09"/><line x1="112.0" y1="59.6" x2="119.6" y2="59.7" opacity="0.20"/><line x1="112.0" y1="59.6" x2="101.7" y2="46.8" opacity="0.10"/><line x1="112.0" y1="59.6" x2="116.8" y2="43.7" opacity="0.08"/><line x1="119.6" y1="59.7" x2="116.8" y2="43.7" opacity="0.09"/><line x1="119.6" y1="59.7" x2="141.2" y2="57.1" opacity="0.09"/><line x1="119.6" y1="59.7" x2="101.7" y2="46.8" opacity="0.06"/><line x1="141.2" y1="57.1" x2="157.6" y2="47.1" opacity="0.07"/><line x1="149.1" y1="56.9" x2="157.6" y2="47.1" opacity="0.11"/><line x1="149.1" y1="56.9" x2="135.4" y2="44.0" opacity="0.06"/><line x1="149.1" y1="56.9" x2="169.1" y2="67.4" opacity="0.08"/><line x1="169.1" y1="67.4" x2="180.2" y2="71.6" opacity="0.17"/><line x1="169.1" y1="67.4" x2="175.4" y2="54.5" opacity="0.13"/><line x1="180.2" y1="71.6" x2="194.8" y2="63.7" opacity="0.08"/><line x1="180.2" y1="71.6" x2="175.4" y2="54.5" opacity="0.10"/><line x1="192.8" y1="83.0" x2="199.9" y2="72.0" opacity="0.10"/><line x1="192.8" y1="83.0" x2="192.8" y2="98.0" opacity="0.13"/><line x1="192.8" y1="98.0" x2="204.7" y2="110.2" opacity="0.13"/><line x1="204.7" y1="110.2" x2="219.1" y2="106.4" opacity="0.11"/><line x1="218.5" y1="128.1" x2="227.0" y2="113.0" opacity="0.06"/><line x1="216.1" y1="154.3" x2="234.6" y2="149.2" opacity="0.06"/><line x1="216.1" y1="154.3" x2="226.2" y2="173.5" opacity="0.05"/><line x1="201.2" y1="178.1" x2="226.2" y2="173.5" opacity="0.03"/><line x1="190.5" y1="192.8" x2="205.6" y2="196.1" opacity="0.08"/><line x1="190.5" y1="192.8" x2="188.4" y2="209.0" opacity="0.05"/><line x1="190.5" y1="192.8" x2="175.3" y2="204.9" opacity="0.08"/><line x1="175.3" y1="204.9" x2="188.4" y2="209.0" opacity="0.06"/><line x1="175.3" y1="204.9" x2="170.0" y2="220.2" opacity="0.05"/><line x1="175.3" y1="204.9" x2="159.5" y2="217.3" opacity="0.07"/><line x1="138.4" y1="212.8" x2="126.8" y2="220.9" opacity="0.09"/><line x1="126.8" y1="220.9" x2="118.1" y2="228.1" opacity="0.06"/><line x1="100.0" y1="213.3" x2="84.0" y2="208.3" opacity="0.09"/><line x1="84.0" y1="208.3" x2="75.9" y2="216.2" opacity="0.06"/><line x1="84.0" y1="208.3" x2="74.9" y2="195.7" opacity="0.10"/><line x1="84.0" y1="208.3" x2="98.7" y2="222.0" opacity="0.05"/><line x1="74.9" y1="195.7" x2="75.9" y2="216.2" opacity="0.03"/><line x1="74.9" y1="195.7" x2="56.2" y2="182.6" opacity="0.05"/><line x1="56.2" y1="182.6" x2="51.2" y2="193.7" opacity="0.10"/><line x1="56.2" y1="182.6" x2="40.3" y2="178.8" opacity="0.08"/><line x1="56.2" y1="182.6" x2="49.0" y2="164.5" opacity="0.07"/><line x1="49.0" y1="164.5" x2="43.7" y2="148.9" opacity="0.10"/><line x1="49.0" y1="164.5" x2="40.3" y2="178.8" opacity="0.08"/><line x1="49.0" y1="164.5" x2="28.3" y2="157.5" opacity="0.04"/><line x1="43.7" y1="148.9" x2="38.3" y2="127.4" opacity="0.05"/><line x1="43.7" y1="148.9" x2="29.5" y2="131.3" opacity="0.03"/><line x1="38.3" y1="127.4" x2="39.8" y2="110.0" opacity="0.07"/><line x1="38.3" y1="127.4" x2="27.3" y2="111.1" opacity="0.04"/><line x1="39.8" y1="110.0" x2="27.3" y2="111.1" opacity="0.06"/><line x1="39.8" y1="110.0" x2="48.4" y2="98.7" opacity="0.09"/><line x1="54.4" y1="81.7" x2="53.6" y2="66.4" opacity="0.07"/><line x1="54.4" y1="81.7" x2="66.5" y2="66.0" opacity="0.06"/><line x1="54.4" y1="81.7" x2="34.0" y2="86.5" opacity="0.05"/><line x1="66.5" y1="66.0" x2="53.6" y2="66.4" opacity="0.08"/><line x1="88.0" y1="47.4" x2="101.7" y2="46.8" opacity="0.12"/><line x1="88.0" y1="47.4" x2="68.4" y2="49.4" opacity="0.06"/><line x1="101.7" y1="46.8" x2="100.1" y2="32.0" opacity="0.09"/><line x1="101.7" y1="46.8" x2="116.8" y2="43.7" opacity="0.09"/><line x1="101.7" y1="46.8" x2="115.2" y2="30.5" opacity="0.04"/><line x1="116.8" y1="43.7" x2="115.2" y2="30.5" opacity="0.07"/><line x1="116.8" y1="43.7" x2="135.4" y2="44.0" opacity="0.06"/><line x1="116.8" y1="43.7" x2="100.1" y2="32.0" opacity="0.06"/><line x1="135.4" y1="44.0" x2="141.9" y2="28.7" opacity="0.06"/><line x1="135.4" y1="44.0" x2="157.6" y2="47.1" opacity="0.04"/><line x1="157.6" y1="47.1" x2="175.4" y2="54.5" opacity="0.07"/><line x1="157.6" y1="47.1" x2="180.0" y2="46.6" opacity="0.03"/><line x1="175.4" y1="54.5" x2="180.0" y2="46.6" opacity="0.08"/><line x1="194.8" y1="63.7" x2="199.9" y2="72.0" opacity="0.11"/><line x1="194.8" y1="63.7" x2="207.4" y2="63.1" opacity="0.09"/><line x1="194.8" y1="63.7" x2="180.0" y2="46.6" opacity="0.03"/><line x1="199.9" y1="72.0" x2="213.7" y2="91.6" opacity="0.03"/><line x1="213.7" y1="91.6" x2="225.1" y2="83.7" opacity="0.06"/><line x1="213.7" y1="91.6" x2="219.1" y2="106.4" opacity="0.09"/><line x1="219.1" y1="106.4" x2="227.0" y2="113.0" opacity="0.09"/><line x1="219.1" y1="106.4" x2="227.4" y2="124.4" opacity="0.04"/><line x1="219.1" y1="106.4" x2="225.1" y2="83.7" opacity="0.03"/><line x1="227.4" y1="124.4" x2="227.0" y2="113.0" opacity="0.08"/><line x1="205.6" y1="196.1" x2="188.4" y2="209.0" opacity="0.03"/><line x1="205.6" y1="196.1" x2="228.1" y2="201.4" opacity="0.03"/><line x1="188.4" y1="209.0" x2="170.0" y2="220.2" opacity="0.03"/><line x1="170.0" y1="220.2" x2="169.1" y2="236.4" opacity="0.04"/><line x1="118.1" y1="228.1" x2="98.7" y2="222.0" opacity="0.03"/><line x1="40.3" y1="178.8" x2="36.6" y2="194.7" opacity="0.03"/><line x1="28.3" y1="157.5" x2="22.3" y2="172.2" opacity="0.03"/><line x1="29.5" y1="131.3" x2="27.3" y2="111.1" opacity="0.03"/><line x1="27.3" y1="111.1" x2="15.9" y2="93.3" opacity="0.03"/><line x1="53.6" y1="66.4" x2="39.3" y2="61.3" opacity="0.03"/><line x1="53.6" y1="66.4" x2="68.4" y2="49.4" opacity="0.03"/><line x1="100.1" y1="32.0" x2="87.6" y2="22.4" opacity="0.05"/><line x1="225.1" y1="83.7" x2="244.8" y2="87.5" opacity="0.03"/></g><g fill="#5B7CC4"><circle cx="188.5" cy="128.6" r="1.8" opacity="0.41"/><circle cx="188.8" cy="144.8" r="1.1" opacity="0.45"/><circle cx="186.0" cy="154.9" r="1.1" opacity="0.41"/><circle cx="179.3" cy="172.8" r="1.1" opacity="0.42"/><circle cx="166.8" cy="185.4" r="1.7" opacity="0.44"/><circle cx="146.8" cy="185.0" r="2.0" opacity="0.43"/><circle cx="139.9" cy="187.3" r="1.4" opacity="0.48"/><circle cx="125.2" cy="192.6" r="1.8" opacity="0.44"/><circle cx="109.2" cy="183.7" r="1.1" opacity="0.42"/><circle cx="93.9" cy="179.5" r="1.4" opacity="0.46"/><circle cx="85.4" cy="170.1" r="2.0" opacity="0.47"/><circle cx="75.5" cy="161.1" r="1.6" opacity="0.49"/><circle cx="71.4" cy="142.5" r="2.2" opacity="0.41"/><circle cx="65.4" cy="130.7" r="1.2" opacity="0.45"/><circle cx="67.3" cy="118.8" r="1.9" opacity="0.46"/><circle cx="78.3" cy="99.3" r="1.8" opacity="0.46"/><circle cx="84.4" cy="88.7" r="2.0" opacity="0.49"/><circle cx="93.7" cy="77.8" r="1.1" opacity="0.47"/><circle cx="107.6" cy="66.9" r="2.0" opacity="0.43"/><circle cx="121.3" cy="66.9" r="1.0" opacity="0.45"/><circle cx="134.3" cy="72.0" r="1.1" opacity="0.48"/><circle cx="148.2" cy="73.4" r="1.5" opacity="0.49"/><circle cx="161.9" cy="77.4" r="1.7" opacity="0.49"/><circle cx="181.0" cy="88.7" r="1.3" opacity="0.44"/><circle cx="187.7" cy="98.3" r="2.1" opacity="0.42"/><circle cx="186.9" cy="113.2" r="1.3" opacity="0.45"/><circle cx="201.6" cy="130.9" r="1.0" opacity="0.33"/><circle cx="203.3" cy="144.2" r="2.1" opacity="0.36"/><circle cx="198.6" cy="160.7" r="1.8" opacity="0.30"/><circle cx="189.5" cy="178.5" r="2.0" opacity="0.37"/><circle cx="179.7" cy="183.5" r="1.1" opacity="0.35"/><circle cx="168.5" cy="188.1" r="1.3" opacity="0.31"/><circle cx="153.0" cy="195.6" r="1.0" opacity="0.31"/><circle cx="141.6" cy="201.7" r="1.0" opacity="0.38"/><circle cx="121.5" cy="200.0" r="1.3" opacity="0.32"/><circle cx="109.6" cy="197.2" r="2.0" opacity="0.39"/><circle cx="93.4" cy="194.1" r="1.1" opacity="0.30"/><circle cx="83.2" cy="184.3" r="2.0" opacity="0.31"/><circle cx="69.7" cy="180.3" r="1.6" opacity="0.30"/><circle cx="66.5" cy="157.8" r="1.6" opacity="0.39"/><circle cx="55.0" cy="142.0" r="1.3" opacity="0.33"/><circle cx="53.4" cy="133.6" r="1.6" opacity="0.37"/><circle cx="60.0" cy="116.9" r="2.0" opacity="0.39"/><circle cx="61.2" cy="95.2" r="2.0" opacity="0.36"/><circle cx="68.4" cy="88.7" r="1.4" opacity="0.29"/><circle cx="78.5" cy="79.9" r="1.3" opacity="0.36"/><circle cx="97.4" cy="64.2" r="2.1" opacity="0.39"/><circle cx="112.0" cy="59.6" r="1.3" opacity="0.31"/><circle cx="119.6" cy="59.7" r="1.7" opacity="0.38"/><circle cx="141.2" cy="57.1" r="1.8" opacity="0.37"/><circle cx="149.1" cy="56.9" r="2.1" opacity="0.37"/><circle cx="169.1" cy="67.4" r="1.2" opacity="0.37"/><circle cx="180.2" cy="71.6" r="2.2" opacity="0.33"/><circle cx="192.8" cy="83.0" r="1.9" opacity="0.31"/><circle cx="192.8" cy="98.0" r="2.1" opacity="0.37"/><circle cx="204.7" cy="110.2" r="2.2" opacity="0.36"/><circle cx="218.5" cy="128.1" r="1.2" opacity="0.19"/><circle cx="216.1" cy="154.3" r="1.6" opacity="0.28"/><circle cx="214.1" cy="166.5" r="2.0" opacity="0.21"/><circle cx="201.2" cy="178.1" r="1.3" opacity="0.25"/><circle cx="190.5" cy="192.8" r="1.2" opacity="0.28"/><circle cx="175.3" cy="204.9" r="1.7" opacity="0.28"/><circle cx="159.5" cy="217.3" r="1.6" opacity="0.24"/><circle cx="138.4" cy="212.8" r="1.5" opacity="0.21"/><circle cx="126.8" cy="220.9" r="1.2" opacity="0.24"/><circle cx="100.0" cy="213.3" r="1.4" opacity="0.24"/><circle cx="84.0" cy="208.3" r="1.1" opacity="0.25"/><circle cx="74.9" cy="195.7" r="1.9" opacity="0.24"/><circle cx="56.2" cy="182.6" r="2.1" opacity="0.23"/><circle cx="49.0" cy="164.5" r="1.6" opacity="0.26"/><circle cx="43.7" cy="148.9" r="1.6" opacity="0.28"/><circle cx="38.3" cy="127.4" r="2.1" opacity="0.22"/><circle cx="39.8" cy="110.0" r="2.0" opacity="0.20"/><circle cx="48.4" cy="98.7" r="1.1" opacity="0.21"/><circle cx="54.4" cy="81.7" r="1.9" opacity="0.28"/><circle cx="66.5" cy="66.0" r="1.8" opacity="0.20"/><circle cx="88.0" cy="47.4" r="1.3" opacity="0.29"/><circle cx="101.7" cy="46.8" r="2.2" opacity="0.27"/><circle cx="116.8" cy="43.7" r="1.6" opacity="0.22"/><circle cx="135.4" cy="44.0" r="1.9" opacity="0.19"/><circle cx="157.6" cy="47.1" r="1.0" opacity="0.22"/><circle cx="175.4" cy="54.5" r="1.1" opacity="0.29"/><circle cx="194.8" cy="63.7" r="1.1" opacity="0.22"/><circle cx="199.9" cy="72.0" r="1.3" opacity="0.20"/><circle cx="213.7" cy="91.6" r="2.0" opacity="0.22"/><circle cx="219.1" cy="106.4" r="1.7" opacity="0.26"/><circle cx="227.4" cy="124.4" r="1.8" opacity="0.15"/><circle cx="234.6" cy="149.2" r="1.8" opacity="0.19"/><circle cx="226.2" cy="173.5" r="1.1" opacity="0.20"/><circle cx="205.6" cy="196.1" r="1.7" opacity="0.20"/><circle cx="188.4" cy="209.0" r="1.6" opacity="0.13"/><circle cx="170.0" cy="220.2" r="1.1" opacity="0.13"/><circle cx="144.7" cy="229.0" r="1.9" opacity="0.14"/><circle cx="118.1" cy="228.1" r="1.4" opacity="0.11"/><circle cx="98.7" cy="222.0" r="1.9" opacity="0.17"/><circle cx="75.9" cy="216.2" r="2.1" opacity="0.12"/><circle cx="51.2" cy="193.7" r="1.6" opacity="0.19"/><circle cx="40.3" cy="178.8" r="1.8" opacity="0.21"/><circle cx="28.3" cy="157.5" r="1.8" opacity="0.17"/><circle cx="29.5" cy="131.3" r="1.1" opacity="0.12"/><circle cx="27.3" cy="111.1" r="1.3" opacity="0.13"/><circle cx="34.0" cy="86.5" r="2.0" opacity="0.18"/><circle cx="53.6" cy="66.4" r="1.4" opacity="0.16"/><circle cx="68.4" cy="49.4" r="1.3" opacity="0.21"/><circle cx="100.1" cy="32.0" r="1.3" opacity="0.21"/><circle cx="115.2" cy="30.5" r="1.0" opacity="0.15"/><circle cx="141.9" cy="28.7" r="1.2" opacity="0.16"/><circle cx="158.8" cy="34.6" r="1.1" opacity="0.15"/><circle cx="180.0" cy="46.6" r="1.4" opacity="0.13"/><circle cx="207.4" cy="63.1" r="1.9" opacity="0.18"/><circle cx="225.1" cy="83.7" r="1.5" opacity="0.14"/><circle cx="227.0" cy="113.0" r="1.9" opacity="0.17"/><circle cx="251.1" cy="122.3" r="2.1" opacity="0.11"/><circle cx="243.9" cy="171.2" r="1.2" opacity="0.10"/><circle cx="228.1" cy="201.4" r="2.0" opacity="0.13"/><circle cx="200.5" cy="229.5" r="1.8" opacity="0.12"/><circle cx="169.1" cy="236.4" r="1.2" opacity="0.09"/><circle cx="136.7" cy="251.2" r="1.7" opacity="0.11"/><circle cx="91.0" cy="243.3" r="1.6" opacity="0.05"/><circle cx="55.2" cy="224.4" r="1.6" opacity="0.10"/><circle cx="36.6" cy="194.7" r="1.9" opacity="0.08"/><circle cx="22.3" cy="172.2" r="1.9" opacity="0.07"/><circle cx="7.3" cy="125.9" r="1.6" opacity="0.09"/><circle cx="15.9" cy="93.3" r="1.9" opacity="0.11"/><circle cx="39.3" cy="61.3" r="1.2" opacity="0.08"/><circle cx="65.0" cy="33.9" r="1.7" opacity="0.05"/><circle cx="87.6" cy="22.4" r="1.8" opacity="0.12"/><circle cx="132.9" cy="14.1" r="1.6" opacity="0.10"/><circle cx="164.8" cy="21.2" r="2.1" opacity="0.07"/><circle cx="208.4" cy="36.0" r="1.0" opacity="0.10"/><circle cx="232.4" cy="62.4" r="1.5" opacity="0.08"/><circle cx="244.8" cy="87.5" r="1.3" opacity="0.11"/></g>';

const CSS = `/* ---- talk-to-it widget ----
   The orb beats while the assistant is speaking, driven by the SDK's
   volume-level event where it is available and by a plain CSS pulse where it
   is not, so it still reads as alive on browsers that give us nothing. */
/* The floating control is the same sphere as the hero's, small, with one
   word under it. */
.vc-bubble{position:fixed; right:18px; bottom:18px; z-index:60;
  display:flex; flex-direction:column; align-items:center; gap:6px;
  border:0; background:none; padding:0; cursor:pointer; font-family:inherit}
.vc-bubble .ball{position:relative; width:64px; height:64px; border-radius:50%;
  display:grid; place-items:center; color:#10224A;
  background:radial-gradient(circle at 34% 30%, #BFE3F5 0%, #9EC4F7 42%, #A89BF2 100%);
  box-shadow:0 10px 30px rgba(37,99,235,.32);
  transition:transform .16s ease-out}
.vc-bubble .ball::before{content:""; position:absolute; inset:-9px; border-radius:50%;
  background:radial-gradient(circle, color-mix(in srgb,var(--blue) 24%,transparent) 0%, transparent 68%);
  animation:vcidle 3.4s ease-in-out infinite}
@keyframes vcidle{0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.14);opacity:.85}}
.vc-bubble:hover .ball{transform:scale(1.06)}
.vc-bubble svg{position:relative; width:24px; height:24px}
.vc-bubble .lbl{font-size:13.5px; font-weight:800; color:var(--ink);
  letter-spacing:.01em}
.vc-bubble:hover .lbl{color:var(--blue)}
.vc-bubble:focus-visible{outline:2px solid var(--blue); outline-offset:6px; border-radius:16px}
@media(prefers-reduced-motion:reduce){ .vc-bubble .ball::before{animation:none} }

.vc-panel{position:fixed; right:18px; bottom:110px; z-index:61; width:min(360px,calc(100vw - 36px));
  background:#fff; border:1px solid var(--line); border-radius:20px; overflow:hidden}
.vc-panel[hidden]{display:none}
.vc-head{display:flex; align-items:center; gap:var(--s3); padding:var(--s4) var(--s6);
  border-bottom:1px solid var(--line)}
.vc-head b{font-size:15px; font-weight:800}
.vc-head img{height:22px; width:auto}
.vc-x{margin-left:auto; background:none; border:0; cursor:pointer; font-size:22px;
  line-height:1; color:var(--muted); width:44px; height:44px; border-radius:10px}
.vc-x:hover{background:var(--bg-soft); color:var(--ink)}
.vc-body{padding:var(--s4) var(--s6) var(--s6); text-align:center}

/* The dot field drifts slowly and swells with the orb, so the whole stage
   breathes rather than just the circle. */
.vc-stage{position:relative; width:230px; height:230px; margin:0 auto var(--s2);
  display:grid; place-items:center}
.vc-field-slot{position:absolute; inset:0;
  transform:scale(var(--field,1)); transition:transform .12s ease-out}
.vc-field{position:absolute; inset:0; width:100%; height:100%;
  transform-origin:50% 50%; animation:vcspin 46s linear infinite, vcbreathe 13s ease-in-out infinite}
.vc-field.b{animation:vcspin-r 71s linear infinite, vcbreathe 17s ease-in-out infinite -6s;
  opacity:.6}
@keyframes vcspin{to{rotate:360deg}}
@keyframes vcspin-r{to{rotate:-360deg}}
@keyframes vcbreathe{0%,100%{scale:1} 50%{scale:1.045}}
.vc-stage.is-live .vc-field{animation-name:vcspin,vcswell}
.vc-stage.is-live .vc-field.b{animation-name:vcspin-r,vcswell}
@keyframes vcswell{0%,100%{opacity:.75} 30%{opacity:1} 60%{opacity:.85}}
@media(prefers-reduced-motion:reduce){ .vc-field{animation:none} }
.vc-orb{position:relative; width:112px; height:112px; margin:0;
  transform:scale(var(--orb,1)); transition:transform .09s ease-out;
  border-radius:50%; display:grid; place-items:center;
  background:radial-gradient(circle at 34% 30%, #BFE3F5 0%, #9EC4F7 42%, #A89BF2 100%)}
.vc-orb::before{content:""; position:absolute; inset:-14px; border-radius:50%;
  background:radial-gradient(circle, color-mix(in srgb,var(--blue) 26%,transparent) 0%, transparent 68%);
  transform:scale(var(--beat,1)); transition:transform .09s ease-out}
.vc-orb svg{position:relative; width:34px; height:34px; color:#10224A}
.vc-orb.is-live::before{animation:vcbeat 1.5s ease-in-out infinite}
@keyframes vcbeat{0%,100%{transform:scale(1);opacity:.55} 28%{transform:scale(1.22);opacity:.95}
  46%{transform:scale(1.06);opacity:.7} 70%{transform:scale(1.16);opacity:.85}}
@media(prefers-reduced-motion:reduce){ .vc-orb.is-live::before{animation:none} }

.vc-state{font-size:14px; font-weight:700; color:var(--ink); min-height:20px}
.vc-sub{font-size:13px; line-height:19px; color:var(--muted); margin:6px 0 var(--s4)}
  font-size:13.5px; line-height:19px}
.vc-body .btn{width:100%}

/* The same orb, sitting in the hero so it is the first thing on the page.
   Clicking it opens the panel and starts the call in that one gesture. */
.vc-hero{display:block; margin:var(--s4) auto 0; padding:0; border:0;
  background:none; cursor:pointer; font-family:inherit; text-align:center}
.vc-hero .vc-stage{width:min(300px,62vw); height:min(300px,62vw); margin:0 auto}
@media(min-width:700px){ .vc-hero{margin-top:var(--s6)} .vc-hero .vc-stage{width:284px; height:284px} }
/* A short laptop viewport would cut the line under the orb, so the orb gives
   back what the viewport is missing. */
@media(min-width:700px) and (max-height:860px){
  .vc-hero{margin-top:var(--s3)}
  .vc-hero .vc-stage{width:208px; height:208px}
}
.vc-hero .vc-orb{width:38%; height:38%}
.vc-hero .vc-orb svg{width:32%; height:32%; min-width:26px; min-height:26px}
.vc-hero-can{display:block; max-width:34ch; margin:6px auto 0; font-size:13.5px;
  line-height:19px; color:var(--muted)}
.vc-hero-lbl{display:inline-flex; align-items:center; gap:8px; margin-top:var(--s2);
  font-size:15px; font-weight:700; color:var(--blue)}
.vc-hero-lbl::before{content:""; width:7px; height:7px; border-radius:50%;
  background:var(--cyan); animation:adot 1.9s ease-in-out infinite}
.vc-hero:hover .vc-orb{filter:brightness(1.05)}
.vc-hero:hover .vc-hero-lbl{color:var(--blue-dk)}
.vc-hero:focus-visible{outline:2px solid var(--blue); outline-offset:6px; border-radius:20px}
/* While the call runs the hero says what is happening where the prompt was —
   the page does not grow a dialog around it. */
.vc-hero-live{display:none}
.vc-hero.is-calling .vc-hero-lbl, .vc-hero.is-calling .vc-hero-can{display:none}
.vc-hero.is-calling .vc-hero-live{display:block}
.vc-hero-state{display:inline-flex; align-items:center; gap:8px; font-size:15px;
  font-weight:700; color:var(--blue); min-height:22px}
.vc-hero-state::before{content:""; width:7px; height:7px; border-radius:50%;
  background:var(--cyan); animation:adot 1.9s ease-in-out infinite}
/* One line at a time, and it goes on its own. A transcript that piles up turns
   the hero into a log; this is just proof it heard you. */
.vc-hero-line{display:block; max-width:40ch; margin:6px auto 0; min-height:38px;
  font-size:14.5px; line-height:19px; color:var(--muted);
  opacity:0; transition:opacity .5s ease}
.vc-hero-line.in{opacity:1}
.vc-hero-line b{color:var(--ink-2); font-weight:700}
@media(prefers-reduced-motion:reduce){
  .vc-hero-state::before{animation:none}
  .vc-hero-line{transition:none}
}
@media(prefers-reduced-motion:reduce){ .vc-hero-lbl::before{animation:none} }
`;

const MARKUP = `<button type="button" class="vc-bubble" id="vc-bubble" aria-expanded="false" aria-label="Speak to the assistant" aria-controls="vc-panel">
  <span class="ball"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 15a3.5 3.5 0 003.5-3.5v-6a3.5 3.5 0 10-7 0v6A3.5 3.5 0 0012 15zm6-3.5a6 6 0 01-5 5.92V21h-2v-3.58a6 6 0 01-5-5.92h2a4 4 0 008 0z"/></svg></span>
  <span class="lbl">Speak</span>
</button>

<div class="vc-panel" id="vc-panel" role="dialog" aria-label="Talk to VoiceCaptures" hidden>
  <div class="vc-head">
    <img src="/img/logo-mark.png" width="512" height="512" alt="">
    <b>Talk to VoiceCaptures</b>
    <button type="button" class="vc-x" id="vc-x" aria-label="Close">&times;</button>
  </div>
  <div class="vc-body">
    <div class="vc-stage">
      <div class="vc-field-slot" data-vc-field></div>
      <div class="vc-orb" id="vc-orb">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 15a3.5 3.5 0 003.5-3.5v-6a3.5 3.5 0 10-7 0v6A3.5 3.5 0 0012 15zm6-3.5a6 6 0 01-5 5.92V21h-2v-3.58a6 6 0 01-5-5.92h2a4 4 0 008 0z"/></svg>
      </div>
    </div>
    <p class="vc-state" id="vc-state">Ready when you are</p>
    <p class="vc-sub" id="vc-sub">It answers in your browser. Ask it anything, book a meeting with sales, or leave a message and it emails the team.</p>
    <button class="btn btn-primary" id="vc-go" type="button">Start talking</button>
  </div>
</div>
`;

(function inject(){
  const st = document.createElement("style");
  st.textContent = CSS;
  document.head.appendChild(st);
  const host = document.createElement("div");
  host.innerHTML = MARKUP;
  while (host.firstChild) document.body.appendChild(host.firstChild);
  // Two counter-rotating copies of the same net, so it never sits still.
  document.querySelectorAll("[data-vc-field]").forEach((slot) => {
    slot.innerHTML =
      '<svg class="vc-field" viewBox="0 0 260 260" aria-hidden="true">' + FIELD + '</svg>' +
      '<svg class="vc-field b" viewBox="0 0 260 260" aria-hidden="true">' + FIELD + '</svg>';
  });
})();

/* ---------------------------------------------------------------------------
   Talk to the assistant, in the browser, over Vapi's Web SDK.

   FILL THESE IN. Both come from the Vapi dashboard. The public key is meant
   to be visible in page source; the private key must never be.

   Before this goes anywhere public, set BOTH of these on the key in Vapi:
     Allowed Origins    -> https://voicecaptures.com   (a key with no origins
                           set works from anywhere, which is how strangers run
                           up your minutes)
     Allowed Assistants -> the one assistant below
   Origin and assistant limits are the only controls Vapi documents here;
   there is no spend cap, so the caps further down are ours.
--------------------------------------------------------------------------- */
const VAPI_PUBLIC_KEY   = "e321c752-3efd-401d-97f8-6f41eded6660";
const VAPI_ASSISTANT_ID = "2980a8c6-e543-4440-9f29-5ee97bd15fd0";

const MAX_SECONDS   = 180;  // one session; the assistant is hung up after this
const MAX_PER_VISIT = 3;    // sessions per browser tab

(function(){
  "use strict";
  const $ = (id) => document.getElementById(id);
  const bubble = $("vc-bubble"), panel = $("vc-panel"), orb = $("vc-orb"),
        state = $("vc-state"), sub = $("vc-sub"),
        go = $("vc-go"), close = $("vc-x");
  if (!bubble) return;

  let vapi = null, live = false, timer = null, left = 0;

  const say = (t, s) => {
    state.textContent = t;
    if (s !== undefined) sub.textContent = s;
    if (inline) heroSay(t);
  };
  const used = () => +(sessionStorage.getItem("vc-calls") || 0);

  function openPanel(open){
    panel.hidden = !open;
    bubble.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) go.focus();
  }
  bubble.addEventListener("click", () => openPanel(panel.hidden));

  // Any element with data-vc-talk opens the panel; data-vc-talk="start" also
  // starts the call, because the click is the gesture the mic prompt needs.
  // The hero orb IS the control: it runs the call where it stands, so clicking
  // it does not grow a dialog over the page. Everything else opens the panel.
  const hero     = document.querySelector(".vc-hero");
  const heroState= document.getElementById("vc-hero-state");
  const heroLine = document.getElementById("vc-hero-line");
  let inline = false;

  window.vcTalk = function(autostart, inPlace){
    if (inPlace) {
      inline = true;
      if (live) { stop(); return; }
      // On the CLICK, not on call-start: if the call never connects, the hero
      // still has somewhere to say so. Anything that ends the attempt — the
      // error path, stop(), call-end — takes it back out.
      heroCalling(true);
      heroSay("Connecting\u2026");
      start();
      return;
    }
    inline = false;
    openPanel(true);
    if (autostart && !live) start();
  };
  document.querySelectorAll("[data-vc-talk]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const mode = el.getAttribute("data-vc-talk");
      window.vcTalk(mode === "start", el === hero);
    });
  });

  // Where the words and the status go: the hero while it is the one talking,
  // the panel otherwise. One function, so neither surface can be left stale.
  let fade = null;
  function heroSay(t){ if (heroState) heroState.textContent = t; }
  function heroLineSet(role, text){
    if (!heroLine) return;
    heroLine.innerHTML = "";
    const b = document.createElement("b");
    b.textContent = role === "user" ? "You: " : "";
    heroLine.appendChild(b);
    heroLine.appendChild(document.createTextNode(text));
    heroLine.classList.add("in");
    clearTimeout(fade);
    // Long enough to read, short enough that it is gone before the next one.
    fade = setTimeout(() => heroLine.classList.remove("in"), 4200);
  }
  function heroCalling(on){
    if (!hero) return;
    hero.classList.toggle("is-calling", on);
    if (!on && heroLine) { clearTimeout(fade); heroLine.classList.remove("in"); heroLine.textContent = ""; }
  }
  close.addEventListener("click", () => { openPanel(false); if (live) stop(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) { openPanel(false); if (live) stop(); }
  });

  // There are two of each on the page — the hero's and the panel's — and both
  // answer to the voice, so these walk the lot rather than the first match.
  const orbs   = () => document.querySelectorAll(".vc-orb");
  const stages = () => document.querySelectorAll(".vc-stage");
  function beat(v){
    // volume-level is 0..1; map it to a gentle swell rather than a twitch
    const amp = Math.min(1, v);
    const glow = (1 + amp * 0.45).toFixed(3);
    const ball = (1 + amp * 0.13).toFixed(3);
    orbs().forEach((o) => {
      o.style.setProperty("--beat", glow);
      o.style.setProperty("--orb", ball);
    });
    stages().forEach((st) => st.style.setProperty("--field", (1 + amp * 0.12).toFixed(3)));
  }
  function speaking(on){
    orbs().forEach((o) => {
      o.classList.toggle("is-live", on);
      if (!on) { o.style.removeProperty("--beat"); o.style.removeProperty("--orb"); }
    });
    stages().forEach((st) => {
      st.classList.toggle("is-live", on);
      if (!on) st.style.removeProperty("--field");
    });
  }

  function tick(){
    left--;
    if (left <= 0) { say("That is the demo limit", "Call the line for a longer one."); stop(); return; }
    if (left <= 30) sub.textContent = left + "s left in this demo";
  }

  async function start(){
    if (!VAPI_PUBLIC_KEY || !VAPI_ASSISTANT_ID) {
      say("Not connected yet", "Add the Vapi public key and assistant ID to switch this on.");
      return;
    }
    if (used() >= MAX_PER_VISIT) {
      say("That is enough for one visit", "Call the line or build your own demo assistant.");
      return;
    }
    go.disabled = true;
    say("Connecting…", "Allow the microphone when your browser asks.");
    try {
      if (!vapi) {
        const SOURCES = [
          "https://esm.sh/@vapi-ai/web@3.0.1",
          "https://cdn.jsdelivr.net/npm/@vapi-ai/web@3.0.1/+esm"
        ];
        let Vapi = null, loadErr = null;
        for (const src of SOURCES) {
          try { Vapi = (await import(src)).default; if (Vapi) { console.info("vapi sdk from", src); break; } }
          catch (e) { loadErr = e; console.warn("vapi sdk failed from", src, e); }
        }
        if (!Vapi) throw new Error("SDK did not load: " + (loadErr && loadErr.message));
        vapi = new Vapi(VAPI_PUBLIC_KEY);
        vapi.on("call-start", () => {
          live = true; go.disabled = false; go.textContent = "End";
          sessionStorage.setItem("vc-calls", used() + 1);
          say("Listening", "Ask it anything, or ask it to book you a meeting.");
          left = MAX_SECONDS; timer = setInterval(tick, 1000);
        });
        vapi.on("call-end", () => {
          live = false; go.disabled = false; go.textContent = "Start talking";
          clearInterval(timer); speaking(false); heroCalling(false);
          if (!/limit/.test(state.textContent)) say("Call ended", "Start another, or call the line.");
        });
        vapi.on("speech-start", () => { speaking(true); say("Speaking", ""); });
        vapi.on("speech-end", () => { speaking(false); say("Listening", "Go ahead."); });
        vapi.on("volume-level", beat);
        // The transcript is back, but it never accumulates: one finished line at
        // a time under the hero, which fades on its own.
        vapi.on("message", (m) => {
          if (!inline) return;
          if (m && m.type === "transcript" && m.transcriptType === "final" && m.transcript)
            heroLineSet(m.role, m.transcript);
        });
        vapi.on("error", (e) => {
          live = false; go.disabled = false; go.textContent = "Start talking";
          clearInterval(timer); speaking(false);
          const detail = (e && (e.errorMsg || e.message || (e.error && e.error.message))) || "";
          say("That did not connect", detail ? detail : "Call (365) 603-9234 instead.");
          console.error("vapi error event:", e);
        });
      }
      await vapi.start(VAPI_ASSISTANT_ID);
    } catch (err) {
      go.disabled = false;
      const denied = err && /permission|denied|NotAllowed/i.test(err.name + " " + err.message);
      say(denied ? "Microphone blocked" : "That did not connect",
          denied ? "Allow the mic in your browser, or call the line."
                 : ((err && err.message) || "Call (365) 603-9234 instead."));
      if (inline) {
        // The hero has no second line to explain itself in, so the reason goes
        // where the transcript would, and the orb comes back out of its call.
        heroLineSet("assistant", denied
          ? "Allow the microphone in your browser, or call (365) 603-9234."
          : "It could not connect just now. Call (365) 603-9234 instead.");
        setTimeout(() => heroCalling(false), 4600);
      }
      console.error("vapi start failed:", err);
    }
  }

  function stop(){
    clearInterval(timer); speaking(false); heroCalling(false);
    try { if (vapi) vapi.stop(); } catch (e) {}
    live = false; go.disabled = false; go.textContent = "Start talking";
  }

  go.addEventListener("click", () => (live ? stop() : start()));
  window.addEventListener("pagehide", () => { if (live) stop(); });
})();
