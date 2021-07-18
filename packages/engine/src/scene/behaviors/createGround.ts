import { CircleBufferGeometry, Color, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from 'three'
import { BodyType } from 'three-physx'
import { Behavior } from '../../common/interfaces/Behavior'
import { Entity } from '../../ecs/classes/Entity'
import { addComponent, getComponent, getMutableComponent } from '../../ecs/functions/EntityFunctions'
import { addColliderWithoutEntity } from '../../physics/behaviors/colliderCreateFunctions'
import { ColliderComponent } from '../../physics/components/ColliderComponent'
import { CollisionGroups } from '../../physics/enums/CollisionGroups'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { addObject3DComponent } from './addObject3DComponent'

type GroundProps = {
  color: string
}

export const createGround = (entity: Entity, args: GroundProps) => {
  const mesh = new Mesh(
    new CircleBufferGeometry(1000, 32).rotateX(-Math.PI / 2),
    new MeshStandardMaterial({
      color: new Color(0.313410553336143494, 0.31341053336143494, 0.30206481294706464),
      roughness: 0
    })
  )

  addObject3DComponent(entity, {
    obj3d: mesh,
    objArgs: { receiveShadow: true, 'material.color': args.color }
  })

  addComponent(entity, ColliderComponent, {
    bodytype: BodyType.STATIC,
    type: 'ground',
    collisionLayer: CollisionGroups.Ground,
    collisionMask: CollisionGroups.Default,
    position: new Vector3().copy(mesh.position),
    quaternion: new Quaternion().copy(mesh.quaternion),
    scale: new Vector3().copy(mesh.scale)
  })

  const colliderComponent = getMutableComponent(entity, ColliderComponent)

  const body = addColliderWithoutEntity(
    { bodytype: colliderComponent.bodytype, type: colliderComponent.type },
    colliderComponent.position,
    colliderComponent.quaternion,
    colliderComponent.scale,
    { collisionLayer: colliderComponent.collisionLayer, collisionMask: colliderComponent.collisionMask }
  )
  colliderComponent.body = body
}
