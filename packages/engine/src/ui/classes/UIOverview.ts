import { Block, Text } from "../../assets/three-mesh-ui";
import { Object3D, Color, VideoTexture } from "three";
import { UIBaseElement, UI_ELEMENT_SELECT_STATE } from "./UIBaseElement";

export class UIOverview extends UIBaseElement {
  constructor(title, description, imageUrl) {
    super();

    this.init(title, description, imageUrl);
  }

  init(title, description, url) {
    // const imageElement = new ImageElement(3.2, 0.8, 0.1, 1.35, url);
    // this.add(imageElement);

    const textBlock = new Block({
      height: 0.1,
      width: 0.9,
      margin: 0.00,
      padding: 0.00,
      fontSize: 0.025,
      alignContent: "left",
      backgroundColor: new Color('red'),
      backgroundOpacity: 0.0,

      fontFamily:
        "https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.json",
      fontTexture:
        "https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.png"
    }).add(
      new Text({
        content: title + '\n',
        fontSize: 0.05,
        // fontColor: new THREE.Color(0x96ffba)
      }),
      new Text({
        content: description
      })
    );

    textBlock.position.set(-0.95, 1.1, 0.04);

    this.add(textBlock);
  }

  update() {
  }
}