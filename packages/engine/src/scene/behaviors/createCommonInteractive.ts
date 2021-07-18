import { Behavior } from '../../common/interfaces/Behavior'
import { EngineEvents } from '../../ecs/classes/EngineEvents'
import { addComponent, getComponent, hasComponent } from '../../ecs/functions/EntityFunctions'
import { Interactable } from '../../interaction/components/Interactable'
import { InteractiveSystem } from '../../interaction/systems/InteractiveSystem'
import { Object3DComponent } from '../components/Object3DComponent'
import { grabEquippable } from '../../interaction/functions/grabEquippable'
import { InteractionData } from '../../interaction/types/InteractionTypes'

export const onInteraction = (entityInitiator, args, delta, entityInteractive, time) => {
  const interactiveComponent = getComponent(entityInteractive, Interactable)

  if (interactiveComponent.data.interactionType === 'equippable') {
    grabEquippable(entityInitiator, args, delta, entityInteractive)
  } else {
    EngineEvents.instance.dispatchEvent({
      type: InteractiveSystem.EVENTS.OBJECT_ACTIVATION,
      ...interactiveComponent.data
    })
  }
}

export const onInteractionHover = (
  entityInitiator,
  { focused }: { focused: boolean },
  delta,
  entityInteractive,
  time
) => {
  const interactiveComponent = getComponent(entityInteractive, Interactable)

  const engineEvent: any = { type: InteractiveSystem.EVENTS.OBJECT_HOVER, focused, ...interactiveComponent.data }
  EngineEvents.instance.dispatchEvent(engineEvent)

  if (focused) {
  } else {
  }

  if (!hasComponent(entityInteractive, Object3DComponent)) {
    return
  }

  // TODO: add object to OutlineEffect.selection? or add OutlineEffect

  // const object3d = getMutableComponent(entityInteractive, Object3DComponent).value as Mesh;
}

export const createCommonInteractive = (entity, args: InteractionData) => {
  if (!args.interactable) {
    return
  }

  const interactiveData = {
    onInteraction: onInteraction,
    onInteractionFocused: onInteractionHover,
    onInteractionCheck: () => {
      return true
    },
    data: args
  }

  addComponent(entity, Interactable, interactiveData)
}
