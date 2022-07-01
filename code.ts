//this plugin will be used to convert Figma prototype pages into a React prototype app

//Typeguard functions
function determineIfISceneOrFrame(toBeDetermined:(FrameNode | SceneNode)): toBeDetermined is FrameNode  {
  if((toBeDetermined as FrameNode).type){
    return true
  }
  return false
}

function determineIfISceneOrOther(toBeDetermined:(BaseNode|SliceNode | SceneNode)): toBeDetermined is SceneNode  {
  if((toBeDetermined as SceneNode).type){
    return true
  }
  return false
}

//Classes and Interfaces for types we will use
class Color{
  r: number;
  g: number;
  b: number;
  constructor(r,g,b) {
    this.r = 255*r;
    this.g = 255*g;
    this.b = 255*b;
  }
}

class BoundingBox{
    x: number;
    y: number;
    width: number;
    height: number;
    constructor(x,y,width,height) {
        this.x = x;
        this.y= y;
        this.width = width;
        this.height = height;
    }
}


class ColorFill{
  opacity: number;
  isGradient: boolean;
  rgb1: Color;
  rgb2: Color;
  constructor(opacity, isGradient, r1,g1,b1,r2,g2,b2) {
    this.opacity = opacity;
    this.isGradient = isGradient;
    this.rgb1 = new Color(r1,g1,b1);
    this.rgb2 = new Color(r2,g2,b2);
  }
}



//RECTANGLE

class Rectangle {
    id: string;
    cornerRadius: number;
    cornerSmoothing: number;
    fill: ColorFill;
    background: ColorFill;
    bounds: BoundingBox
    constructor(rect: RectangleNode) {
        this.id = rect.id;
        this.cornerRadius = rect.cornerRadius as number;
        this.cornerSmoothing = rect.cornerSmoothing;
        this.bounds = new BoundingBox(rect.x,rect.y,rect.width,rect.height);
        if(rect.fills[0].type === "GRADIENT_LINEAR") {
          this.fill = new ColorFill(rect.opacity,true,rect.fills[0].gradientStops[0].color.r,rect.fills[0].gradientStops[0].color.g,rect.fills[0].gradientStops[0].color.b,
            rect.fills[0].gradientStops[1].color.r,rect.fills[0].gradientStops[1].color.g,rect.fills[0].gradientStops[1].color.b);
        } else if(rect.fills[0].type === "SOLID") {
          this.fill = new ColorFill(rect.opacity,false,rect.fills[0].color.r,rect.fills[0].color.g,rect.fills[0].color.b,0,0,0);
        } else {
          throw new Error("only fill types of 'SOLID' and 'GRADIENT_LINEAR' are supported");
        }
    }
}



//TEXT
class Text {
    id:string;
    content:string;
    fontName: FontName;
    fontSize: number;
    textAlignHorizontal: string;
    textAlignVertical: string;
    fill: ColorFill;
    bounds: BoundingBox;
    constructor(text:TextNode) {
        this.id = text.id;
        this.content = text.characters;
        this.fontName = text.fontName as FontName ;
        this.fontSize = text.fontSize as number;
        this.textAlignHorizontal = text.textAlignHorizontal;
        this.textAlignVertical = text.textAlignVertical;
        this.fill = new ColorFill(text.opacity,false,text.fills[0].color.r,text.fills[0].color.g,text.fills[0].color.b,0,0,0);
        this.bounds = new BoundingBox(text.x,text.y,text.width,text.height);
    }
};



//VECTOR
class Vector {



}



//ELLIPSE
class Ellipse {
  id:string;
  fill: ColorFill;
  bounds: BoundingBox;
  constructor(ell: EllipseNode) {
    this.id = ell.id;
    if(ell.fills[0].type === "SOLID") {
      this.fill = new ColorFill(ell.opacity,false,ell.fills[0].color.r,ell.fills[0].color.g,ell.fills[0].color.b,0,0,0);
    } else if(ell.fills[0].type === "GRADIENT_LINEAR") {
      this.fill = new ColorFill(ell.opacity,true,ell.fills[0].gradientStops[0].color.r,ell.fills[0].gradientStops[0].color.g,ell.fills[0].gradientStops[0].color.b,
        ell.fills[0].gradientStops[1].color.r,ell.fills[0].gradientStops[1].color.g,ell.fills[0].gradientStops[1].color.b);
    } else {
      throw new Error("only fill types of 'SOLID' and 'GRADIENT_LINEAR' are supported");
    }
    this.bounds = new BoundingBox(ell.x,ell.y,ell.width,ell.height);
  }
}




//COMPONENT
//InstanceNodes are just instances of already existing ComponentNodes so we should only store them once as an object but multiple times in the tree
//    InstanceNode.mainComponent will return the component that this instance reflects
//    In the JSON representation of the file, the main component will always come before instances of that component
//    Idea is to use an array of strings that represents id's of all unique component nodes encountered
//      For any instance that is encountered, compare InstanceNode.mainComponent.id with the id's in the array until a match is found
//      Store instance node in tree using id of original component that instance corresponds to
//      This allows us to only store one mapping for the component in the hash table (original ID -> component object data)
class Component{
  id: string;
  name: string;
  bounds: BoundingBox;
  fill: ColorFill;
  constructor(comp: ComponentNode) {
    this.id = comp.id;
    this.name = comp.name;
    this.bounds = new BoundingBox(comp.x,comp.y,comp.width,comp.height);
    if(comp.fills[0].visible === false) {
        this.fill = new ColorFill(0,false,0,0,0,0,0,0);
    }
    else if(comp.fills[0].type === "SOLID") {
      this.fill = new ColorFill(comp.opacity,false,comp.fills[0].color.r,comp.fills[0].color.g,comp.fills[0].color.b,0,0,0);
    } else if(comp.fills[0].type === "GRADIENT_LINEAR") {
      this.fill = new ColorFill(comp.opacity,true,comp.fills[0].gradientStops[0].color.r,comp.fills[0].gradientStops[0].color.g,comp.fills[0].gradientStops[0].color.b,
        comp.fills[0].gradientStops[1].color.r,comp.fills[0].gradientStops[1].color.g,comp.fills[0].gradientStops[1].color.b);
    } else {
      throw new Error("only fill types of 'SOLID' and 'GRADIENT_LINEAR' are supported");
    }
  }
}


//GROUP 








//Defining Data Structures

//hashTable stores (key,value) pairing of node id -> class for that type that contains all relevant data needed to reconstruct styling and UI
const hashTable = new Map();
//hashTable.set(node.id,node);

class TreeNode {
  type: String;
  id: String;
  subComponents: Array<TreeNode>
  constructor(type: string, id: string) {
    this.type = type; //Save type so we know node's methods and properties
    this.id = id; //Save id so we can always access node using figma.getNodeById
    this.subComponents = [];
  }
};



/////////////////////////
//PARSING DATA INTO CLASSES AND DATA STRUCTURES
/////////////////////////

let numFrames;
let temp:BaseNode;
let topLevelFrames:Array<TreeNode> = [];
temp = figma.getNodeById(figma.currentPage.id);
//console.log(`this file's key is ${figma.fileKey}`);
//console.log(`this page's id is ${figma.currentPage.id}`);
if(temp.type === "PAGE") {
  numFrames = temp.children.length;  
  for(let i = 0; i < temp.children.length; i++) {
     let tempNode:(FrameNode|SceneNode) = temp.children[i];
     if(determineIfISceneOrFrame(tempNode) && temp.children[i].type === "FRAME") {
      let newTreeNode = new TreeNode("FRAME",tempNode.id);
      topLevelFrames.push(newTreeNode);
     }     
  }
}

//Must remember to check if components are visible or not before putting them into data structures so we only render what is desired
let componentTreeNodes:Array<TreeNode> = [];
for(let i = 0; i < topLevelFrames.length ; i++) {
  //console.log(topLevelFrames[i]);
  //console.log(`looking for rectangles that are descendants of frame with id ${topLevelFrames[i].id}`);
  let currFrameNode:FrameNode = figma.getNodeById(topLevelFrames[i].id as string) as FrameNode;
  let numChildren = currFrameNode.children.length;
  for(let j = 0; j < numChildren; j++) {
    if(currFrameNode.children[j].type === "RECTANGLE") { //WORKING FOR RECTANGLES
      let rect:RectangleNode = currFrameNode.children[j] as RectangleNode;
      let newTreeNode = new TreeNode("RECTANGLE",rect.id);
      let paintFill:Array<Paint> = rect.fills as Array<Paint>;
      if(paintFill.length != 0 && (rect.fills[0].type === "SOLID" || rect.fills[0].type === "GRADIENT_LINEAR")) {
        //if the length of fill is 0, the component won't have any color fill so it is probably irrelevant for the design
          topLevelFrames[i].subComponents.push(newTreeNode);
          let rectObj = new Rectangle(rect);
          hashTable.set(rect.id,rectObj);
      }
    } else if(currFrameNode.children[j].type === "TEXT") {
      let text:TextNode = currFrameNode.children[j] as TextNode;
      let newTreeNode = new TreeNode("TEXT",text.id);
      topLevelFrames[i].subComponents.push(newTreeNode);
      let textObj = new Text(text);
      hashTable.set(text.id,textObj);
    } else if(currFrameNode.children[j].type === "POLYGON") {
      //discard PolygonNode types because the variation in shapes is too difficult to handle for limited use cases
    } else if(currFrameNode.children[j].type === "ELLIPSE") {
      let ell:EllipseNode = currFrameNode.children[j] as EllipseNode;
      let newTreeNode = new TreeNode("ELLIPSE",ell.id);
      let paintFill:Array<Paint> = ell.fills as Array<Paint>;
      if(paintFill.length != 0 && (ell.fills[0].type === "SOLID" || ell.fills[0].type === "GRADIENT_LINEAR")) {
        topLevelFrames[i].subComponents.push(newTreeNode);
        let ellObj = new Ellipse(ell);
        hashTable.set(ell.id,ellObj);
      }
    } else if(currFrameNode.children[j].type === "FRAME") {
      //when not used at the top level, frames are essentially rectangles but allow designers to use auto layout for text so will almost always have text as subcomponent
      //we will treat these frames the same as any rectangle but parse its text subcomponent into the tree immediately to avoid issues later when recursing on the tree
      let rect = currFrameNode.children[j] as RectangleNode;
      let newTreeNode = new TreeNode("RECTANGLE",rect.id);
      let paintFill:Array<Paint> = rect.fills as Array<Paint>;
      if(paintFill.length != 0 && (rect.fills[0].type === "SOLID" || rect.fills[0].type === "GRADIENT_LINEAR")) {
        //if the length of fill is 0, the component won't have any color fill so it is probably irrelevant for the design
          topLevelFrames[i].subComponents.push(newTreeNode);
          let rectObj = new Rectangle(rect);
          hashTable.set(rect.id,rectObj);
      }
      //now parse the descendants of this frame node into the tree
      let frame = currFrameNode.children[j] as FrameNode;
      for(let k = 0; k < frame.children.length; k++) {
        if(frame.children[k].type === "TEXT") {
          let text:TextNode = frame.children[k] as TextNode;
          let textTreeNode = new TreeNode("TEXT",text.id);
          newTreeNode.subComponents.push(textTreeNode);
          let textObj = new Text(text);
          hashTable.set(text.id,textObj);
        }
      }

      
    } else if(currFrameNode.children[j].type === "COMPONENT") {
      console.log(currFrameNode.children[j]);
      let comp = currFrameNode.children[j] as ComponentNode;
      let newTreeNode = new TreeNode("COMPONENT", comp.id);
      topLevelFrames[i].subComponents.push(newTreeNode);
      
      let compObj = new Component(comp);
      hashTable.set(comp.id,compObj);
      //parse the descendants of this component node into the tree 
      for(let k = 0; k < comp.children.length; k++) {
        let rect = comp.children[k] as RectangleNode;
        let rectTreeNode = new TreeNode("RECTANGLE",rect.id);
        newTreeNode.subComponents.push(rectTreeNode);
        let rectObj = new Rectangle(rect);
        hashTable.set(rect.id,rectObj);
      }
      componentTreeNodes.push(newTreeNode);
    } else if(currFrameNode.children[j].type === "INSTANCE") {
      //Since every instance is an instance of a component, only add data for components to hash table to avoid duplicates and redundancy 
      let inst = currFrameNode.children[j] as InstanceNode;
      let compId = inst.mainComponent.id;
      console.log(`instance with id ${inst.id} has main component of id ${compId}`);
      console.log(inst.mainComponent);
      throw new Error("STOP");
      let matchingNode:TreeNode;
      componentTreeNodes.forEach(node => {
        if(node.id === compId) {
          matchingNode = node;
        }
      });
      topLevelFrames[i].subComponents.push(matchingNode);
    } else {
      console.log(currFrameNode.children[j]);
    }
  } 
//  console.log("finished with node");

}

console.log("topLevelFrames")
console.log(topLevelFrames);



//close the plugin so it stops running
figma.closePlugin(); //close the plugin so it stops running
