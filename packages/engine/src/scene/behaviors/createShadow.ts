import { Behavior } from '../../common/interfaces/Behavior'
import { addComponent, getMutableComponent } from '../../ecs/functions/EntityFunctions'
import ShadowComponent from '../components/ShadowComponent'

export const createShadow = (entity, args: { castShadow: boolean; receiveShadow: boolean }) => {
  addComponent(entity, ShadowComponent)
  const component = getMutableComponent(entity, ShadowComponent)
  component.castShadow = args.castShadow || false
  component.receiveShadow = args.receiveShadow || false
}
