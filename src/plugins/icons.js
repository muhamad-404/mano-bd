import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faHeart,
  faStar,
  faCakeCandles,
  faEnvelope,
  faGift,
  faLock,
  faKey,
  faMusic,
  faVolumeXmark,
  faVolumeHigh,
  faWandMagicSparkles,
  faCloudRain,
  faCloudSun,
  faPaperPlane,
  faMoon,
  faBookOpen,
  faGraduationCap,
  faCircleCheck,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faXmark,
  faBars,
  faPause,
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faHeart,
  faStar,
  faCakeCandles,
  faEnvelope,
  faGift,
  faLock,
  faKey,
  faMusic,
  faVolumeXmark,
  faVolumeHigh,
  faWandMagicSparkles,
  faCloudRain,
  faCloudSun,
  faPaperPlane,
  faMoon,
  faBookOpen,
  faGraduationCap,
  faCircleCheck,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faXmark,
  faBars,
  faPause,
)

export function installIcons(app) {
  app.component('FaIcon', FontAwesomeIcon)
}
