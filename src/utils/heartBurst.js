import { ref } from 'vue'

export const heartBurstTick = ref(0)

export function burstHearts() {
  heartBurstTick.value += 1
}
