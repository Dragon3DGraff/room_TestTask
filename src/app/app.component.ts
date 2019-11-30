import { AfterViewInit, Component, ElementRef, Input, ViewChild, HostListener } from '@angular/core';
import * as THREE from 'three';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class CubeComponent implements AfterViewInit {
  title = 'room';
  usver = 'Денисов Илья Dragon3DGRaff';
  
    private cameraPerpective: THREE.PerspectiveCamera;
    private cameraOrtho: THREE.OrthographicCamera;
    private camera:  any;
    roomCount: number = 0;

    private get canvas() : HTMLCanvasElement {
      return this.canvasRef.nativeElement;
    }
    
    @ViewChild('canvas', {static: false})
    private canvasRef: ElementRef;
  
  
    private renderer: THREE.WebGLRenderer;
  
    private scene: THREE.Scene;
    private grid: THREE.LineSegments;

    private raycaster: THREE.Raycaster = new THREE.Raycaster();
    private objects: THREE.Mesh[] = [];
    private plane: THREE.Mesh;
   
    private firstPoint: THREE.Vector2 = undefined;
    private lastPoint: THREE.Vector2 = undefined;

    private Phantom: THREE.Mesh;
    private MaterialPhantom:  THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } );
    private MaterialPhantomLine:  THREE.LineBasicMaterial = new THREE.LineBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } );
  
    private MaterialSubPar: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial( { color: new THREE.Color('lime')} );

  
    private magnitized: boolean = false;
    private magnitPoint: THREE.Vector3 = new THREE.Vector3();
    private phantomMagnetLine;


    public  MODE:string = "_SIMPLEPARRALILLEPIPED";//"_NOTHING";

    private selectables: THREE.Mesh[] = [];
    private linesRoomArray: any[] = [];

   private floorPointsArray: THREE.Vector2[] = [];
   private floorArray: THREE.Mesh[] = [];
   @Input() public viewMode: string = "Ortho"; //"Ortho" "3D"
   @Input() public magnetMode: boolean = false;

    private movement = {
      obj: undefined,
      moving: false,
      startPoint: undefined,
      deltaX: undefined,
      deltaZ: undefined,
      clear: function(){
        this.obj = undefined,
          this.moving = false,
          this.startPoint = undefined,
          this.deltaX = undefined,
          this.deltaZ = undefined
      },
    }

    private testMesh: THREE.Mesh;
    
     coords: string = "Нажмите кнопку \"Комната\", чтобы начать построение. Комнату нужно создавать против часовой стрелки";
   
    @Input() height: number;
  @Input() width: number;

  
    @Input()
    public size: number = 1;
  
    @Input()
    public cameraZ: number = 400;
  
    @Input()
    public fieldOfView: number = 70;
  
    @Input('nearClipping')
    public nearClippingPane: number = 1;
  
    @Input('farClipping')
    public farClippingPane: number = 1000;

    @Input()
    public frustumSize: number = 25;
  
  
  
    
    constructor() { }

    createParallelepiped (x: number, y: number, z: number, widthX: number = 0, widthY: number = 0, height: number, Material: THREE.Material){
      let geometry = new THREE.BoxGeometry(widthX, widthY, height);
      
      let Parallelepiped: THREE.Mesh = new THREE.Mesh(geometry, Material);
      Parallelepiped.position.x = x;
      Parallelepiped.position.y = y;
      Parallelepiped.position.z = z;     

      this.scene.add(Parallelepiped);
      return Parallelepiped;
    }
    createSphereHelper(x: number, y: number, z: number, radius: number){
      let geometry: THREE.SphereBufferGeometry = new THREE.SphereBufferGeometry(radius);
      let sphereHelper: THREE.Mesh = new THREE.Mesh(geometry, this.MaterialPhantom);
      sphereHelper.position.x = x;
      sphereHelper.position.y = y;
      sphereHelper.position.z = z; 
      sphereHelper.name = "Сфера";
      this.scene.add(sphereHelper);
      return sphereHelper;
    };

    //-------------Переключение режимов приложения------------
    buttonMoveClick (event:any){
      this.MODE = "_MOVE"; 
      this.coords = this.MODE;
    }
    buttonParallelepipedClick (event:any){
      this.MODE = "_SIMPLEPARRALILLEPIPED"; 
      this.coords = this.MODE;
    }
    buttonRoomClick (event:any){
      this.MODE = "_ROOMCREATION"; 
      this.coords = this.MODE;
    }
   //----------------------------------------------------------

   //-------------------Переключение режима камеры----------------
   button3DClick(event: any){
    this.viewMode = "3D";
     //----------------Camera-------------------------- 
     let aspectRatio = this.getAspectRatio();
      
     //для PerspectiveCamera

     if (this.viewMode === "3D"){

     this.cameraPerpective = new THREE.PerspectiveCamera(
       this.fieldOfView,
       aspectRatio,
       this.nearClippingPane,
       this.farClippingPane
     );
     this.camera = this.cameraPerpective;
     }
     this.camera.position.z = 8;
     this.camera.position.y = 9;
     this.camera.position.x = 6;
     this.camera.lookAt(0,0,0);
    
   }
   button2DClick(event: any){
    this.viewMode = "Ortho";
     //----------------Camera-------------------------- 
     let aspectRatio = this.getAspectRatio();
     //для OrthographicCamera
     if (this.viewMode === "Ortho"){

     this.cameraOrtho = new THREE.OrthographicCamera(
         this.frustumSize * aspectRatio/-2,
          this.frustumSize * aspectRatio/2,
          this.frustumSize   / 2,
          this.frustumSize   / -2,
          0.001,
          1000         
     );
     this.camera = this.cameraOrtho;
     
     }
     this.camera.position.z = 0;
     this.camera.position.y = 9;
     this.camera.position.x = 0;
     this.camera.lookAt(0,0,0);
    
   }

   createRoomFunction(){
     if ( this.MODE === "_ROOMCREATION" && this.floorPointsArray.length>2){
    this.scene.remove( this.testMesh );
    ++this.roomCount;
    //рисуем пол
    let roomtShape = new THREE.Shape();
    roomtShape.moveTo(this.floorPointsArray[0].x,this.floorPointsArray[0].y);
    for (let index = 1; index < this.floorPointsArray.length; index++) {
     roomtShape.lineTo(this.floorPointsArray[index].x,this.floorPointsArray[index].y);                 
    }
     let geometry = new THREE.ShapeBufferGeometry( roomtShape );
     let material = new THREE.MeshBasicMaterial( { color: new THREE.Color('moccasin'), side: THREE.DoubleSide, transparent:true, opacity: 0.5 } );
      let roomMesh = new THREE.Mesh( geometry, material ) ;
      roomMesh.rotation.x = 90 *(Math.PI/180);
      roomMesh.name = "Room_" + this.roomCount;
       this.scene.add(roomMesh );
       this.objects.push(roomMesh);
       this.floorArray.push(roomMesh);

        //возьмем геометрию из буфергеометрии. 
        // let floorGeometry = <THREE.ShapeBufferGeometry>roomMesh.geometry;
        // let newFloorGeometry = new THREE.Geometry;
        // newFloorGeometry.fromBufferGeometry(floorGeometry); 
        // newFloorGeometry.mergeVertices();
        // //построим плоскость для raycast               
        //  let floorMeshForRaycast = new THREE.Mesh(newFloorGeometry,  new THREE.MeshBasicMaterial( {   color: new THREE.Color('red'), side: THREE.DoubleSide, transparent:true, opacity: 0.5 }));
        //  floorMeshForRaycast.rotation.x = (90) *(Math.PI/180);
        
        //  floorMeshForRaycast.name = "intersectionPlane";
        //  this.scene.add(floorMeshForRaycast);

         console.log(roomMesh);

       //нарисуем линию
       let materialLine = new THREE.MeshBasicMaterial( { color: new THREE.Color('black'), side: THREE.DoubleSide } );
       let geometryLine = new THREE.Geometry();
       geometryLine.vertices.push(
          new THREE.Vector3(this.floorPointsArray[0].x,0, this.floorPointsArray[0].y ),
           new THREE.Vector3(this.floorPointsArray[this.floorPointsArray.length-1].x,0, this.floorPointsArray[this.floorPointsArray.length-1].y )
         );
         let lineForRoom = new THREE.Line( geometryLine, materialLine );
         // line.rotation.x = 90 *(Math.PI/180);
            this.scene.add( lineForRoom );
            this.linesRoomArray.push(lineForRoom);

            for (let index = 0; index <  this.linesRoomArray.length; index++) {
              this.linesRoomArray[index].material.color.r = 0;
              //рассчитаем по точкам центр и длину линий
              let center: THREE.Vector3 = new THREE.Vector3();
              let lineForCalc = new THREE.Line3(this.linesRoomArray[index].geometry.vertices[0].clone(),this.linesRoomArray[index].geometry.vertices[1].clone());
              lineForCalc.getCenter(center);
              let distance: number = lineForCalc.distance();
              // console.log(lineForCalc);

              let linetoZero: THREE.Vector3 = new THREE.Vector3(1,0,0);
              linetoZero.subVectors(lineForCalc.end,lineForCalc.start);
              // Угол
              let angle = linetoZero.angleTo(new THREE.Vector3(1,0,0));
              if(lineForCalc.end.z > lineForCalc.start.z) {
                angle = -angle;
              }

              

            //Нарисуем стены
            let wallHeiht = 1;
              let wallgeomPlane: THREE.PlaneGeometry = new THREE.PlaneGeometry(distance, wallHeiht,1 ,1 );
              let wallmaterialPlane: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial( {color: new THREE.Color('magenta'), visible: true,  transparent:true, opacity: 0.9} ); // side: THREE.DoubleSide,
              let wallPlane: THREE.Mesh = new THREE.Mesh( wallgeomPlane, wallmaterialPlane );
              
              if (index <  this.linesRoomArray.length-1){
              wallPlane.rotation.y = angle + THREE.Math.degToRad(180);
              }
              else{
                wallPlane.rotation.y = angle 
              }
              wallPlane.position.y = wallHeiht/2;
              wallPlane.position.x = center.x;
              wallPlane.position.z = center.z;
              wallPlane.name = "wall";
              wallPlane.geometry.computeBoundingBox();
              this.scene.add(wallPlane);
              this.objects.push( wallPlane);
              

               //Нарисуем Фантом для определения с какой стороны пол
              
						// let phantomLine = this.drawLine(
            //   0,
            //   0,
            //   0,
            //   0,
            //   0.5,
            //   0,
            //   this.MaterialPhantomLine
            //   );
              let newPhantomPosition: THREE.Vector3;
             
              let wallGeometry =  <THREE.PlaneGeometry>wallPlane.geometry;
              newPhantomPosition = wallGeometry.faces[0].normal.clone().applyQuaternion(wallPlane.quaternion).multiplyScalar(0.1).add(center);
              
             
              // phantomLine.position.x =  newPhantomPosition.x;
              // phantomLine.position.y = 0.5;
              // phantomLine.position.z =  newPhantomPosition.z;

              //Это подойдет только для выпуклых многоугольников
              let indexForTriangle = index;
              if (index ===  this.linesRoomArray.length-1) indexForTriangle = -1;

              let triangleC = new THREE.Triangle(this.linesRoomArray[index].geometry.vertices[0].clone(),this.linesRoomArray[index].geometry.vertices[1].clone(), this.linesRoomArray[indexForTriangle+1].geometry.vertices[1].clone());
              console.log( triangleC.containsPoint(newPhantomPosition));

              if( !triangleC.containsPoint(newPhantomPosition) ){
              // wallPlane.rotation.y = wallPlane.rotation.y + THREE.Math.degToRad(180);
              }
              let vertexNormalsHelper = new THREE.VertexNormalsHelper( wallPlane, 0.5 );
              this.scene.add( vertexNormalsHelper );
            }
      
  }
   this.coords = "";
    this.MODE = "_NOTHING"; 
    this.coords =  this.MODE;
    this.floorPointsArray = [];
    this.linesRoomArray = [];

   }

  @HostListener('document:keydown.enter', ['$event']) //при нажанатии на Enter создаем комнату
   onKeydownHandler(event: KeyboardEvent) {
     this.createRoomFunction();   

    
}

evbuttonFinishRoom (event: any){
  this.createRoomFunction();   

}
 drawLine (x: number,y: number,z: number,x1: number,y1: number,z1: number, material: THREE.LineBasicMaterial){
	var material = material;//new THREE.LineBasicMaterial( { color: colorDex } );
	var geometry = new THREE.Geometry();
	  geometry.vertices.push(new THREE.Vector3( x, y, z));
      geometry.vertices.push(new THREE.Vector3( x1, y1, z1));

	var line = new THREE.Line( geometry, material );
   this.scene.add( line );
return line;
}

   //-------------------------------------------------------------
    
    onDocumentMouseClick (event: any){
        event.preventDefault();

        let screenPoint: THREE.Vector2 =  new THREE.Vector2();
        var rect = this.renderer.domElement.getBoundingClientRect();
        screenPoint.set(  ( event.clientX - rect.left ) / ( rect.width - rect.left )  * 2 - 1,
       - (  ( event.clientY - rect.top ) / ( rect.bottom - rect.top)) * 2 + 1 );
       
        this.raycaster.setFromCamera( screenPoint, this.camera );
      let intersects = this.raycaster.intersectObjects( this.objects );
      if ( intersects.length > 0 ) {
        if (this.MODE === "_MOVE"){

            if (intersects[ 0 ].object.name === "Параллелепипед"){
              this.movement.moving = this.movement.moving?false:true;
              if (this.movement.moving){
                this.movement.obj = intersects[ 0 ].object;
                this.movement.deltaX = intersects[ 0 ].object.position.x -  intersects[ 0 ].point.x;
                this.movement.deltaZ = intersects[ 0 ].object.position.z -  intersects[ 0 ].point.z;
                

                //Нарисуем Фантом для магнита
						this.phantomMagnetLine = this.drawLine(
              0,
              intersects[ 0 ].object.position.y,
              0,
              0,
              intersects[ 0 ].object.position.y,
              this.movement.obj.geometry.boundingBox.min.z,
              this.MaterialPhantomLine);
              
                this.phantomMagnetLine.position.x = intersects[ 0 ].object.position.x;
                this.phantomMagnetLine.position.y = intersects[ 0 ].object.position.y;
                this.phantomMagnetLine.position.z = intersects[ 0 ].object.position.z;

                this.phantomMagnetLine.rotation.x = intersects[ 0 ].object.rotation.x;
                this.phantomMagnetLine.rotation.y = intersects[ 0 ].object.rotation.y;
                this.phantomMagnetLine.rotation.z = intersects[ 0 ].object.rotation.z;
                
              }
              else{
                this.movement.clear();
                this.scene.remove(this.phantomMagnetLine); //Удалим Фантом для магнита
               
              
              }
              }
					
        }	
        if ( this.MODE === "_ROOMCREATION"){
          this.coords = "Для построения необходимо более двух точек";

          if (intersects[0].object.name === "mainPlane"){
            let intersect = intersects[ 0 ];
            let point = new THREE.Vector2();
            point.x = intersect.point.x;
            point.y = intersect.point.z;
         
            this.floorPointsArray.push(point);


            if (this.floorPointsArray.length > 2){ //если точек больше  двух начинаем рисовать многоугольник
              this.coords = "Для завершения нажмите Enter или нажмите кнопку Завершить";
              this.scene.remove( this.testMesh ); //но сначала удалим старый

               let roomtShape = new THREE.Shape();
               roomtShape.moveTo(this.floorPointsArray[0].x,this.floorPointsArray[0].y);
               for (let index = 1; index < this.floorPointsArray.length; index++) {
                roomtShape.lineTo(this.floorPointsArray[index].x,this.floorPointsArray[index].y);                 
               }
                let geometry = new THREE.ShapeBufferGeometry( roomtShape );
                let material = new THREE.MeshBasicMaterial( { color: new THREE.Color('grey'), side: THREE.DoubleSide, transparent:true, opacity: 0.5 } );
                 this.testMesh = new THREE.Mesh( geometry, material ) ;
                 this.testMesh.rotation.x = 90 *(Math.PI/180);
                  this.scene.add( this.testMesh );

            }
            if (this.floorPointsArray.length > 1){
              //нарисуем линию
              let material = new THREE.MeshBasicMaterial( { color: new THREE.Color('red'), side: THREE.DoubleSide } );
              let geometry = new THREE.Geometry();
                geometry.vertices.push(
                  new THREE.Vector3(this.floorPointsArray[this.floorPointsArray.length-2].x,0, this.floorPointsArray[this.floorPointsArray.length-2].y ),
                  new THREE.Vector3(this.floorPointsArray[this.floorPointsArray.length-1].x,0, this.floorPointsArray[this.floorPointsArray.length-1].y ),
                );
                let lineForRoom = new THREE.Line( geometry, material );
                // line.rotation.x = 90 *(Math.PI/180);
                   this.scene.add( lineForRoom );
                   this.linesRoomArray.push(lineForRoom);

            }
             
          }

        }

       
      }
     
    }


onDocumentMouseDown (event: any){
   event.preventDefault();

   let screenPoint: THREE.Vector2 =  new THREE.Vector2();
   var rect = this.renderer.domElement.getBoundingClientRect();
       screenPoint.set(  ( event.clientX - rect.left ) / ( rect.width - rect.left )  * 2 - 1,
        - (  ( event.clientY - rect.top ) / ( rect.bottom - rect.top)) * 2 + 1 );
     
        this.raycaster.setFromCamera( screenPoint, this.camera );
        let intersects = this.raycaster.intersectObjects( this.objects );
        if ( intersects.length > 0 ) {
          //------------------Режим рисования параллелепипеда------------------
          //получение первой точки построения
          if ( this.MODE === "_SIMPLEPARRALILLEPIPED"){
            if (intersects[0].object.name.includes("Room")) {
              // console.log("Это комната");
            }
            if (intersects[0].object.name.includes("Room")) { // будем рисовать параллелепипед только в комнате

            // if (intersects[0].object.name === "mainPlane"){
                  this.firstPoint = new THREE.Vector2();
				    	    let intersect = intersects[ 0 ];
					        this.firstPoint.set(intersect.point.x, intersect.point.z);
               // this.firstPoint = intersects[0].point;
                // this.coords = "firstPoint: x = " +  this.firstPoint.x.toFixed(3) + ", y = " + this.firstPoint.y.toFixed(3) ;
            }

          }
         
          //-------------------------------------------------------------------
        }
      
} 
onDocumentMouseMove(event: MouseEvent){
      event.preventDefault();

      var rect = this.renderer.domElement.getBoundingClientRect();
      
      let screenPoint: THREE.Vector2 =  new THREE.Vector2();
      screenPoint.set(  ( event.clientX - rect.left ) / ( rect.width - rect.left )  * 2 - 1,
       - (  ( event.clientY - rect.top ) / ( rect.bottom - rect.top)) * 2 + 1 );
      
      this.raycaster.setFromCamera( screenPoint, this.camera );
      let intersects = this.raycaster.intersectObjects( this.objects );
      //если есть какие то пересечения
      if ( intersects.length > 0 ) {
       

        //------------------Режим рисования параллелепипеда------------------
          //отрисовка фантома
        if ( this.MODE === "_SIMPLEPARRALILLEPIPED"){
				
					if (this.firstPoint){
					
            if (intersects[0].object.name.includes("Room")) {
					// if (intersects[ 0 ].object.name === "mainPlane"){
            if (this.Phantom) this.scene.remove(this.Phantom);
            
						if(this.firstPoint){
              var intersect = intersects[ 0 ];
              this.lastPoint =  new THREE.Vector2();
							this.lastPoint.set(intersect.point.x, intersect.point.z);
                    //Фантом	
                
					    	  this.Phantom = this.createParallelepiped (this.firstPoint.x + (this.lastPoint.x - this.firstPoint.x)/2,
					    	  0.05,
					    	  this.firstPoint.y + (this.lastPoint.y - this.firstPoint.y)/2,
					    	  Math.abs(this.firstPoint.x - this.lastPoint.x),
					    	  0.1,
					   		  Math.abs(this.firstPoint.y - this.lastPoint.y),
					   		  this.MaterialPhantom);
						}					
					
					}
					}

				}
        if (this.MODE === "_MOVE"){ // Двигаем парраллелепипед

          if (this.movement.moving){
            // фантом линию двигаем всегда
            this.phantomMagnetLine.position.x =  intersects[ 0 ].point.x + this.movement.deltaX;
            this.phantomMagnetLine.position.z =  intersects[ 0 ].point.z + this.movement.deltaZ;
            
            if (!this.magnitized){ // если параллелепипед не примагничен, то двигаем его
						this.movement.obj.position.x = intersects[ 0 ].point.x + this.movement.deltaX;
            this.movement.obj.position.z = intersects[ 0 ].point.z + this.movement.deltaZ;  
            }  
           
            var originPoint = this.movement.obj.position.clone();
            let collisionCount: number = 0;               
          
            //проверям пересечения каждой его вершины
            for (let vertexIndex = 0; vertexIndex < this.movement.obj.geometry.vertices.length; vertexIndex++)
                {       
                  let localVertex = this.movement.obj.geometry.vertices[vertexIndex].clone();
                  let globalVertex = localVertex.applyMatrix4( this.movement.obj.matrix );                 
                  let directionVector = globalVertex.sub( originPoint );                  
                  this.raycaster.set( originPoint, directionVector.clone().normalize()  );
                   let collisionResults = this.raycaster.intersectObjects( this.floorArray ); //находим пересечения его вершин с полом
                                 
                    if ( collisionResults.length > 0  ) 
                    {                      
                      ++collisionCount; //считаем количество пересечений
                     
                    } 
                     collisionResults = this.raycaster.intersectObjects( this.objects ); //пускаем лучи в другие объекты
                
                    if ( collisionResults.length > 0 && collisionResults[0].object.name === "wall" ) //находим пересечения его вершин со стеной
                    { 
                      if (collisionResults[0].distance < directionVector.length() + 0.2){ 
                        if( this.movement.obj.rotation.y !== collisionResults[0].object.rotation.y){
                          if(this.magnetMode){
                          this.movement.obj.rotation.y = collisionResults[0].object.rotation.y; //Вращаем Парраллелпипед гранью к стене
                        this.phantomMagnetLine.rotation.y = collisionResults[0].object.rotation.y;
                          }
                        }                        
                      }
                    }                    
                }
               if ( collisionCount < 4){  
                // if (!this.magnitized && collisionCount < 4){      //если количесво пересечений меньше 4, значит какие то вершины не над полом       
                  this.movement.obj.material.color = new THREE.Color("red"); //раскрашиваем параллепипед красным
                  this.coords = "Верните мебель в комнату";
                }
                else{
                  this.movement.obj.material.color = new THREE.Color("white"); //иначе оставляем белым
                  this.coords = this.MODE;
                  
                }
                  //теперь проверим, пересекает ли фантом-линия стену
                  if(this.magnetMode){
              let lineMagnet = this.phantomMagnetLine;     
              let originPointLine = this.phantomMagnetLine.position.clone(); //скопируем вектор положения линии-фантома
             
              let localVertexLine = lineMagnet.geometry.vertices[1].clone(); //скопируем вектор положения второй вершины линии-фантома
              let globalVertexLine = localVertexLine.applyMatrix4( lineMagnet.matrix );                 
              let directionVectorLine = globalVertexLine.sub( originPointLine ); //направление, в котором выпускать луч
              

             this.raycaster.set( this.phantomMagnetLine.position.clone(), directionVectorLine.clone().normalize() ); //выпускаем луч рейкастера
              let collisionResultsLine = this.raycaster.intersectObjects( this.objects ); //получае все объекты, которые он пересек
               
               if ( collisionResultsLine.length > 0 && collisionResultsLine[0].object.name === "wall" ) { //если он что-то пересек и это еще и стена
                 
                if (collisionResultsLine[0].distance < directionVectorLine.length()+0.5){ //точка на расстоянии 0.6 от стены - 
                  this.magnitized = true; //включаем примагничивание
                  this.movement.obj.rotation.y = collisionResultsLine[0].object.rotation.y; //Вращаем Парраллелпипед гранью к стене
                        this.phantomMagnetLine.rotation.y = collisionResultsLine[0].object.rotation.y;
                  let offset = this.movement.obj.geometry.boundingBox.max.z + 0.005; //расстояние от центра движимого объекта до его края
                  let wallMgnet = (<THREE.Mesh>collisionResultsLine[0].object); //Получили из результата объект явным указанием типа. Без этогоо тупой скрипт не понимает (2 часа потерянного времени)
                  let wallMgnetGeometry = <THREE.PlaneGeometry>wallMgnet.geometry; //Получили из объекто геометрию. Тоже явно указывая тупому скрипту тип.

                  let planeNormal: THREE.Vector3 = wallMgnetGeometry.faces[0].normal.clone().applyQuaternion(wallMgnet.quaternion); //Взяли копию нормали плоскости и повернули ее на угол поворота плоскости
                  let newPosition: THREE.Vector3 = collisionResultsLine[0].point.clone().add(planeNormal.clone().multiplyScalar(offset)); //скопировали передвигаемый объект в точку пересечения,                  
                                                                        // прибавили к нему вектор нормали стены, умноженный на расстояние от центра движимого объекта до его края
                  // this.movement.obj.position.copy( collisionResultsLine[0].point.clone().add(planeNormal.clone().multiplyScalar(offset))); //скопировали передвигаемый объект в точку пересечения,
                  // если делать .copy(), то потом пересечения считаются неправильно, смещенно на величину offset
                  this.movement.obj.position.x = newPosition.x;
                  this.movement.obj.position.z = newPosition.z;                  
                  
                }
                else{
                  this.magnitized = false;                 
                  this.movement.obj.position.x = intersects[ 0 ].point.x + this.movement.deltaX;
                  this.movement.obj.position.z = intersects[ 0 ].point.z + this.movement.deltaZ;
                }
               }
              }
              else{
                this.magnitized = false;                 
                this.movement.obj.position.x = intersects[ 0 ].point.x + this.movement.deltaX;
                this.movement.obj.position.z = intersects[ 0 ].point.z + this.movement.deltaZ;
              }
          }
        }	//^Движение парраллелепипеда
        //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        }
 }
  
 onDocumentMouseUp(event: MouseEvent){  
        event.preventDefault();
	
    var rect = this.renderer.domElement.getBoundingClientRect();
      
    let screenPoint: THREE.Vector2 =  new THREE.Vector2();
    screenPoint.set(  ( event.clientX - rect.left ) / ( rect.width - rect.left )  * 2 - 1,
     - (  ( event.clientY - rect.top ) / ( rect.bottom - rect.top)) * 2 + 1 );

	this.raycaster.setFromCamera( screenPoint, this.camera );
	var intersects = this.raycaster.intersectObjects( this.objects );

		if ( intersects.length > 0 ) {

			if ( this.MODE === "_SIMPLEPARRALILLEPIPED"){
        this.lastPoint =  new THREE.Vector2();
        //При отпускании кнопки мыши создаем параллелепипед
          

          if (intersects[0].object.name.includes("Room")) { //проверяем, что мышь находится в комнате
			    // if (intersects[ 0 ].object.name === "mainPlane"){
					  if(this.firstPoint){
					    	var intersect = intersects[ 0 ];
                this.lastPoint.set(intersect.point.x, intersect.point.z);

                if ((this.firstPoint.x - this.lastPoint.x) !== 0 || (this.firstPoint.y - this.lastPoint.y)!== 0) { //проверим, что есть сдвиг, иначе он создаст куб размерами по умолчанию 1
                
                    let Parallelepiped:  THREE.Mesh;
                    let MaterialParallelepiped: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial( { color: new THREE.Color('white'), transparent: false, opacity: 0.7} );
                    let widthX = Math.abs(this.firstPoint.x - this.lastPoint.x);
                    let widthY = 0.1;
                    let height = Math.abs(this.firstPoint.y - this.lastPoint.y);

                          Parallelepiped = this.createParallelepiped (this.firstPoint.x + (this.lastPoint.x - this.firstPoint.x)/2,
                            0.05,
                            this.firstPoint.y + (this.lastPoint.y - this.firstPoint.y)/2,
                            widthX,
                            widthY,
                            height,
                            MaterialParallelepiped
                            );

                        Parallelepiped.geometry.computeBoundingBox(); //по умолчанию он Null, поэтому надо его посчитать. Он нам пригодится для позиционирования при примагничивании
                      Parallelepiped.name = "Параллелепипед";
                    this.selectables.push(Parallelepiped);
                    this.objects.push(Parallelepiped); 
                    //маленький параллелепипед наверху, чтобы отслеживать повороты
                    let smallPar = this.createParallelepiped(0, widthY, -height/2+height/6, widthX, 0.3, height/6, this.MaterialSubPar );
                        Parallelepiped.add(smallPar);
                    
                   
                  
                }
					    if (this.Phantom) this.scene.remove(this.Phantom);

					  }	
					this.firstPoint = undefined;
					this.lastPoint = undefined;
				}	
			}
			

		}

    }
    
     //----------------------Создание сцены---------------------
    private createScene() {
      
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color( 'lightgrey' );

      
  
      //----------------Camera-------------------------- 
      let aspectRatio = this.getAspectRatio();
      
      
     
      //для OrthographicCamera
      if (this.viewMode === "Ortho"){

      this.cameraOrtho = new THREE.OrthographicCamera(
          this.frustumSize * aspectRatio/-2,
           this.frustumSize * aspectRatio/2,
           this.frustumSize   / 2,
           this.frustumSize   / -2,
           0.001,
           1000         
      );
      this.camera = this.cameraOrtho;
      this.camera.position.z = 0;
      this.camera.position.y = 9;
      this.camera.position.x = 0;
      this.camera.lookAt(0,0,0);
      }

      //для PerspectiveCamera

      if (this.viewMode === "3D"){

      this.cameraPerpective = new THREE.PerspectiveCamera(
        this.fieldOfView,
        aspectRatio,
        this.nearClippingPane,
        this.farClippingPane
      );
      this.camera = this.cameraPerpective;
       this.camera.position.z = 8;
			this.camera.position.y = 9;
			this.camera.position.x = 6;
      this.camera.lookAt(0,0,0);
      }

        //--------------------Главная плоскость построения--------------------
        let geomPlane = new THREE.PlaneBufferGeometry(20,20,2 ,2 );
        let materialPlane = new THREE.MeshBasicMaterial( {color: new THREE.Color('white'), side: THREE.DoubleSide} );
        this.plane = new THREE.Mesh( geomPlane, materialPlane );
        this.plane.rotation.x = 90 *(Math.PI/180);
        this.plane.position.y = -0.001;
        this.plane.name = "mainPlane";
        this.scene.add(this.plane);
        this.objects.push( this.plane);
        
        //-------------------Сетка----------------------
      this.grid = new THREE.GridHelper( 20, 20, 0x0000ff,  new THREE.Color('grey'));
      this.grid.position.y = 0.01;     			
        this.scene.add( this.grid )
    }
  
    private getAspectRatio() {
      return this.canvas.clientWidth / this.canvas.clientHeight;
    }
  
    
    private startRenderingLoop() {   
      if (this.viewMode === "3D"){
        this.camera = this.cameraPerpective;
      }
      else {
        this.camera = this.cameraOrtho;
        // console.log(this.camera);  
      }
      
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
      this.renderer.setPixelRatio(devicePixelRatio);
      this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
  
      let component: CubeComponent = this;
      (function render() {            
        requestAnimationFrame(render);        
        component.renderer.render(component.scene, component.camera);
               
        // component.animateCube();
       
      }());
    }
  
  
    @HostListener('window:resize', [])
onResize(): void {
  
    // @HostListener('window:resize', ['$event'])
    // public onResize() {

      //                                            ПОЧЕМУ RESIZE НЕ РАБОТАЕТ????

      // this.height = window.innerHeight;
      // this.width = window.innerWidth;
      
      //  this.canvas.width = event.target.innerWidth;
      //  this.canvas.height = event.target.innerHeight;
      //  console.log(event.target.innerWidth);
      //  console.log(this.canvas.clientWidth);
      //  this.canvas.height = event.target.hei;
      //-------------------для PerspectiveCamera-------------
      if (this.viewMode === "3D"){
      this.cameraPerpective.aspect = this.getAspectRatio();
      this.camera = this.cameraPerpective;
      }
      
      //----------------для OrthographicCamera--------------
      if (this.viewMode === "Ortho"){
      this.cameraOrtho.left = - this.frustumSize *  this.getAspectRatio()/2;
      this.cameraOrtho.right =    this.frustumSize *  this.getAspectRatio()/2;
      this.cameraOrtho.top = this.frustumSize/2 ;
      this.cameraOrtho.bottom = - this.frustumSize /2 ;
      this.camera = this.cameraOrtho;
      }
      
      this.camera.updateProjectionMatrix();      
  
      this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
      
    }
  
    //-----------------после загрузки DOM--------------------
    public ngAfterViewInit() {
      this.createScene(); 
         
      this.startRenderingLoop();
      
    }
}
