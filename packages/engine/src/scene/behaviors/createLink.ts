import { Object3D } from 'three'
import { Behavior } from '../../common/interfaces/Behavior'
import { EngineEvents } from '../../ecs/classes/EngineEvents'
import { addComponent } from '../../ecs/functions/EntityFunctions'
import { Interactable } from '../../interaction/components/Interactable'
import { InteractiveSystem } from '../../interaction/systems/InteractiveSystem'
import { addObject3DComponent } from './addObject3DComponent'

export const createLink = (entity, args: { href: string }) => {
  addObject3DComponent(entity, { obj3d: new Object3D(), objArgs: args })
  const interactiveData = {
    onInteraction: () => {
      window.open(args.href)
    },
    onInteractionFocused: (entityInitiator, { focused }, delta, entityInteractive, time) => {
      EngineEvents.instance.dispatchEvent({
        type: InteractiveSystem.EVENTS.OBJECT_HOVER,
        focused,
        interactionText: 'go to ' + args.href
      })
    },
    data: { action: 'link' }
  }
  addComponent(entity, Interactable, interactiveData as any)
}
