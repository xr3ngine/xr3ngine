import { Behavior } from '../../common/interfaces/Behavior'
import { addComponent } from '../../ecs/functions/EntityFunctions'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { Euler, Quaternion, Vector3 } from 'three'
import { Entity } from '../../ecs/classes/Entity'

interface XYZInterface {
  x: number
  y: number
  z: number
}

export const createTransformComponent = (
  entity: Entity,
  args: { position: XYZInterface; rotation: XYZInterface; scale: XYZInterface }
): void => {
  // TODO: scale?
  const { position, rotation, scale } = args
  const values: { position?: Vector3; rotation?: Quaternion; scale?: Vector3 } = {}

  if (position) {
    values.position = new Vector3(position.x, position.y, position.z)
  }
  if (rotation) {
    const v3rotation = new Vector3(rotation.x, rotation.y, rotation.z)
    values.rotation = new Quaternion().setFromEuler(new Euler().setFromVector3(v3rotation, 'XYZ'))
  }
  if (scale) {
    values.scale = new Vector3(scale.x, scale.y, scale.z)
  }
  addComponent(entity, TransformComponent, values)
}
