import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, MeshPhongMaterial, Quaternion, RingGeometry, Vector3 } from 'three';
import { getLoader } from "../../assets/functions/LoadGLTF";
import { initializeMovingState } from "../../avatar/behaviors/MovingAnimations";
import { CharacterComponent } from "../../avatar/components/CharacterComponent";
import { stopIK } from "../../avatar/functions/IKFunctions";
import { CHARACTER_STATES } from "../../avatar/state/CharacterStates";
import { FollowCameraComponent } from "../../camera/components/FollowCameraComponent";
import { CameraModes } from "../../camera/types/CameraModes";
import { ParityValue } from "../../common/enums/ParityValue";
import { clearBit, getBit, setBit } from "../../common/functions/bitFunctions";
import { SIXDOFType } from "../../common/types/NumericalTypes";
import { Engine } from "../../ecs/classes/Engine";
import { Entity } from "../../ecs/classes/Entity";
import { addComponent, getComponent, getMutableComponent, removeComponent } from '../../ecs/functions/EntityFunctions';
import { Input } from "../../input/components/Input";
import { XRInputReceiver } from '../../input/components/XRInputReceiver';
import { BaseInput } from "../../input/enums/BaseInput";
import { Network } from "../../networking/classes/Network";

let head, controllerGripLeft, controllerLeft, controllerRight, controllerGripRight;

/**
 * 
 * @author Josh Field
 * @returns 
 */
export const startXR = async () => {

  try{

    const cameraFollow = getMutableComponent<FollowCameraComponent>(Network.instance.localClientEntity, FollowCameraComponent) as FollowCameraComponent;
    cameraFollow.mode = CameraModes.XR;
    const actor = getMutableComponent(Network.instance.localClientEntity, CharacterComponent);

    actor.state = setBit(actor.state, CHARACTER_STATES.VR);

    // until retargeting is fixed, we can simply just not init IK
    // initiateIK(Network.instance.localClientEntity)

    actor.modelContainer.children[0]?.traverse((child) => {
      if(child.visible) {
        // child.visible = false;
      }
    })


    head = Engine.renderer.xr.getCamera(Engine.camera);
    controllerLeft = Engine.renderer.xr.getController(1);
    controllerRight = Engine.renderer.xr.getController(0);
    actor.tiltContainer.add(controllerLeft);
    actor.tiltContainer.add(controllerRight);

    Engine.scene.remove(Engine.camera);
    actor.tiltContainer.add(Engine.camera);
    

    // obviously unfinished
    [controllerLeft, controllerRight].forEach((controller) => {
/*
      controller.addEventListener('select', (ev) => {})
      controller.addEventListener('selectstart', (ev) => {})
      controller.addEventListener('selectend', (ev) => {})
      controller.addEventListener('squeeze', (ev) => {})
      controller.addEventListener('squeezestart', (ev) => {})
      controller.addEventListener('squeezeend', (ev) => {})
*/
      controller.addEventListener('connected', (ev) => {
        if(controller.targetRay) {
          controller.targetRay.visible = true;
        } else {
          const targetRay = createController(ev.data);
          controller.add(targetRay);
          controller.targetRay = targetRay;
        }
      })

      controller.addEventListener('disconnected', (ev) => {
        controller.targetRay.visible = false;
      })

    })

    controllerGripLeft = Engine.renderer.xr.getControllerGrip(1);
    controllerGripRight = Engine.renderer.xr.getControllerGrip(0);

    addComponent(Network.instance.localClientEntity, XRInputReceiver, {
      head: head,
      controllerLeft: controllerLeft,
      controllerRight: controllerRight,
      controllerGripLeft: controllerGripLeft,
      controllerGripRight: controllerGripRight
    })

    const obj: any = await new Promise((resolve) => { getLoader().load('/models/webxr/controllers/valve_controller_knu_1_0_right.glb', obj => { resolve(obj) }, console.warn, console.error)});
    const controller3DModel = obj.scene.children[2] as any;

    const controllerMeshRight = controller3DModel.clone();
    const controllerMeshLeft = controller3DModel.clone();

    controllerMeshLeft.scale.multiply(new Vector3(-1, 1, 1));

    controllerMeshRight.material = new MeshPhongMaterial();
    controllerMeshLeft.material = new MeshPhongMaterial();

    controllerMeshRight.position.z = -0.12;
    controllerMeshLeft.position.z = -0.12;

    controllerGripRight.add(controllerMeshRight);
    controllerGripLeft.add(controllerMeshLeft);

    
    actor.tiltContainer.add(controllerGripRight);
    actor.tiltContainer.add(controllerGripLeft);

    return true;
  } catch (e) {
    console.error('Could not create VR session', e)
    return false;
  }
}

/**
 * 
 * @author Avaer Kazmer
 */
export const endXR = () => {
  removeComponent(Network.instance.localClientEntity, XRInputReceiver);
  const cameraFollow = getMutableComponent<FollowCameraComponent>(Network.instance.localClientEntity, FollowCameraComponent) as FollowCameraComponent;
  cameraFollow.mode = CameraModes.ThirdPerson;
  Engine.xrSession.end();
  Engine.xrSession = null;
  // Engine.renderer.setAnimationLoop(null);
  const actor = getMutableComponent(Network.instance.localClientEntity, CharacterComponent);
  Engine.scene.add(Engine.camera);
  stopIK(Network.instance.localClientEntity)
  initializeMovingState(Network.instance.localClientEntity)

  actor.modelContainer.children[0].traverse((child: Mesh) => {
    if(child.isMesh) {
      child.visible = true;
    }
  })
  
  actor.state = clearBit(actor.state, CHARACTER_STATES.VR);

}

// pointer taken from https://github.com/mrdoob/three.js/blob/master/examples/webxr_vr_ballshooter.html
const createController = (data) => {
  let geometry, material;
  switch ( data.targetRayMode ) {
    case 'tracked-pointer':
      geometry = new BufferGeometry();
      geometry.setAttribute( 'position', new Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 1 ], 3 ) );
      geometry.setAttribute( 'color', new Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) );
      geometry.setAttribute( 'alpha', new Float32BufferAttribute( [1, 0 ], 1 ) );
      material = new LineBasicMaterial( { vertexColors: true, blending: AdditiveBlending } );
      return new Line( geometry, material );

    case 'gaze':
      geometry = new RingGeometry( 0.02, 0.04, 32 ).translate( 0, 0, - 1 );
      material = new MeshBasicMaterial( { opacity: 0.5, transparent: true } );
      return new Mesh( geometry, material );
  }
};

export const isInXR = (entity: Entity) => {
  const actor = getMutableComponent(entity, CharacterComponent);
  return Boolean(getBit(actor.state, CHARACTER_STATES.VR));
}

export const getHandPosition = (entity: Entity, hand: ParityValue = ParityValue.NONE): Vector3 | undefined => {
  const input = getComponent(entity, Input).data.get(hand === ParityValue.LEFT ? BaseInput.XR_LEFT_HAND : BaseInput.XR_RIGHT_HAND)
  if(!input) return;
  const sixdof = input.value as SIXDOFType;
  return new Vector3(sixdof.x, sixdof.y, sixdof.z);
}
export const getHandRotation = (entity: Entity, hand: ParityValue = ParityValue.NONE): Quaternion | undefined => {
  const input = getComponent(entity, Input).data.get(hand === ParityValue.LEFT ? BaseInput.XR_LEFT_HAND : BaseInput.XR_RIGHT_HAND)
  if(!input) return;
  const sixdof = input.value as SIXDOFType;
  return new Quaternion(sixdof.qX, sixdof.qY, sixdof.qZ, sixdof.qW);
}
export const getHandTransform = (entity: Entity, hand: ParityValue = ParityValue.NONE): { position: Vector3, rotation: Quaternion } | undefined => {
  const input = getComponent(entity, Input).data.get(hand === ParityValue.LEFT ? BaseInput.XR_LEFT_HAND : BaseInput.XR_RIGHT_HAND)
  if(!input) return;
  const sixdof = input.value as SIXDOFType;
  return { 
    position: new Vector3(sixdof.x, sixdof.y, sixdof.z),
    rotation: new Quaternion(sixdof.qX, sixdof.qY, sixdof.qZ, sixdof.qW)
  }
}