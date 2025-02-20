"use strict"
/* Copyright Toon Boom Animation 2018.

 This script works with WebCC and Toon Boom Producer. It is used to copy & paste the a list of templates
 or individual files from the library to the actual scene. The new nodes are connected to the scene's bottom composite
 and drawings are exposed, at least their first frame.

 Addition: 2018-02-07 Now creating a default network if missing.

 Template (.tpl) folder are instantiated using the drag&drop mechanism.  Individual files (ie. drawing file tvg, bitmap files) are copied to a new column created.

 Entry point:
   paste( filename_of_json_files)

   @param filename_of_json_files - this is a small json files that contains the list of files to paste/copied to the scene.
   @return null
*/

var PNGTransparencyMode = 0; //Premultiplied wih Black
var TGATransparencyMode = 0; //Premultiplied wih Black
var SGITransparencyMode = 0; //Premultiplied wih Black
var LayeredPSDTransparencyMode = 1; //Straight
var FlatPSDTransparencyMode = 2; //Premultiplied wih White

/* read file and return content as json object */
function readJSON(filename) {
  var file = new File(filename);

  try
  {
    if (file.exists)
    {
      file.open(1 /* FileAccess.ReadOnly */
                );
      var string = file.read();
      file.close();
      return JSON.parse(string);
    }
  }
  catch (err)
  {}
  return null;
}

/* extract basename. Given a long filename with path and extension,
  return the name of the file without extension
   ie.  /Users/mbegin/MyFiles/image.png" ===> image
*/

function basename(filename) {
  var qfi = new QFileInfo(filename);
  return qfi.baseName();
}

/*
  add a composite node and connect to this composite the array of 'newNodesUnconnected'.
   return the composite
 */
function addCompositeAndConnect( root, name, newNodesUnconnected )
{
  var composite = node.add( root, "Composite_" + name, "COMPOSITE", 0,0,0);
  if( composite )
  {
    newNodesUnconnected.forEach( function(n) {
                                node.link( n, 0, composite, 0 /* auto add port */ )
                                })
  }
  return composite;
}

/*
 Drop the template file (.tpl) specified by 'filename' into the group 'root' and conect all the output
 nodes of this template to the composite of the scene

 @param root - the root group where the node will be inserted
 @param filename  - the 'tpl' filename.
*/
function dropTemplate( root, filename , transparency, alignmentRule)
{
  var dragObject = copyPaste.copyFromTemplate( filename, 0 /* whole template */,0 /*whole template */, copyPaste.getCurrentPasteOptions() );
  if( dragObject )
  {

    var beforeNodes = node.subNodes(root);
    copyPaste.pasteNewNodes( dragObject, root, copyPaste.getCurrentPasteOptions() );
    var afterNodes = node.subNodes(root);

    var newNodes = [];
    afterNodes.forEach( function( n ) {
      var i;
      for( i = 0; i < beforeNodes.length; ++i )
      {
        if( beforeNodes[i] == n )
          break;
      }
      if( i == beforeNodes.length )
      {
        newNodes.push( n );
      }
    } );

    var newNodesUnconnected = [];
    newNodes.forEach( function( n ) {
      if( node.numberOfOutputPorts( n ) == 1 &&
        node.numberOfOutputLinks( n, 0 ) == 0 )
      {
        newNodesUnconnected.push(n);
        if (node.type(n) == "READ")
        {
          var transparencyAttr = node.getAttr(n, frame.current(), "READ_TRANSPARENCY");
          var opacityAttr = node.getAttr(n, frame.current(), "OPACITY");

          transparencyAttr.setValue(true);
          opacityAttr.setValue(transparency);

          var alignmentAttr = node.getAttr(n, frame.current(), "ALIGNMENT_RULE");
          alignmentAttr.setValue(alignmentRule);
        }
      }
    } );
    if( newNodesUnconnected.length > 1 )
    {
      // if there is > 1 unconnected nodes - collect them to a composite and then
      // connect that new comosite to the bottom composite of the scene where all other
      // asset are connected.
      return addCompositeAndConnect(  root, basename(filename), newNodesUnconnected );
    }
    else
    {
      return newNodesUnconnected[0];
    }
  }
  return null;
}

function getUniqueColumnName( column_prefix )
{
  var suffix = 0;
  // finds if unique name for a column
  var column_name = column_prefix;
  while(suffix < 200)
  {
      if(!column.type(column_name))
          break;

      suffix = suffix + 1;
      column_name = column_prefix + "_" + suffix;
  }
  return column_name;
}

function copyFile( srcFilename, dstFilename )
{
  var srcFile = new PermanentFile(srcFilename);
  var dstFile = new PermanentFile(dstFilename);
  srcFile.copy(dstFile);
}

/*
  given a file (ie. a png, tga,tvg, 3d,...), create a new read module, column and element of the
  right type and put the file within

  @returns the name of the read created so that it can be connected to the graph.
*/
function dropFileInNewElement( root, filename, transparency, alignmentRule)
{
  var vectorFormat = null;
  var extension = null;

  var pos = filename.lastIndexOf( "." );
  if( pos < 0 )
    return null;

  extension = filename.substr(pos+1).toLowerCase();
  if( extension == "jpeg" )
    extension = "jpg";
  if(  extension == "tvg" )
  {
    vectorFormat = "TVG"
    extension ="SCAN"; // element.add() will use this.
  }

  var name = basename(filename);
  var elemId = element.add(name, "BW", scene.numberOfUnitsZ(), extension.toUpperCase(), vectorFormat);
  if ( elemId == -1 )
  {
    // hum, unknown file type most likely -- let's skip it.
    return null; // no read to add.
  }

  var uniqueColumnName = getUniqueColumnName(name);
  column.add(uniqueColumnName , "DRAWING");
  column.setElementIdOfDrawing( uniqueColumnName, elemId );

  var read = node.add(root, name, "READ", 0, 0, 0);
  var transparencyAttr = node.getAttr(read, frame.current(), "READ_TRANSPARENCY");
  var opacityAttr = node.getAttr(read, frame.current(), "OPACITY");
  transparencyAttr.setValue(true);
  opacityAttr.setValue(transparency);

  var alignmentAttr = node.getAttr(read, frame.current(), "ALIGNMENT_RULE");
  alignmentAttr.setValue(alignmentRule);

  var transparencyModeAttr = node.getAttr(read, frame.current(), "applyMatteToColor");
  if (extension == "png")
    transparencyModeAttr.setValue(PNGTransparencyMode);
  if (extension == "tga")
    transparencyModeAttr.setValue(TGATransparencyMode);
  if (extension == "sgi")
    transparencyModeAttr.setValue(SGITransparencyMode);
  if (extension == "psd")
    transparencyModeAttr.setValue(FlatPSDTransparencyMode);

  node.linkAttr(read, "DRAWING.ELEMENT", uniqueColumnName);

  var timing = "1"; // we're creating drawing name '1'

  Drawing.create(elemId, timing, true); // create a drawing drawing, 'true' indicate that the file exists.
  var drawingFilePath = Drawing.filename(elemId, timing);   // get the actual path, in tmp folder.
  copyFile( filename, drawingFilePath );

  //set exposure of all frames.
  var nframes = frame.numberOf();
  for( var i =1; i <= nframes; ++i)
  {
    column.setEntry(uniqueColumnName, 1, i, timing );
  }

  return read; // name of the new drawing layer.
}

/*
  Given a psd file, import it split into its layers with a node for each.

  @returns the name of the read created so that it can be connected to the graph.
*/
function dropPSDSplitLayer(root, filename, transparency, alignmentRule)
{
  var vectorFormat = "TVG";
  var extension = "PSD";

  var pos  = filename.lastIndexOf( "." );
  if (pos < 0 )
    return null;

  var name = basename(filename);

  var newNodes = [];

  if (typeof CELIO === "object") //Verify CELIO plugin is installed. If not, import the PSD flattened.
	
  {
    var layerInfo = CELIO.getLayerInformation(filename);
	

    if (layerInfo)
    {
      var elemId = element.add(name, "BW", scene.numberOfUnitsZ(), extension, "None");

      if ( elemId != -1 )
        Drawing.create(elemId, "1", true);
      else
        return null;

      for (var i in layerInfo)
      {
        var layerName = layerInfo[i].layerName;

        var uniqueColumnName = getUniqueColumnName(name);
        if ( elemId != -1 )
        {
          column.add(uniqueColumnName, "DRAWING");
          column.setElementIdOfDrawing( uniqueColumnName, elemId );
        }
        else
        {
          return null;
        }
        var read = node.add(root, layerName, "READ", 0, 0, 0);
        var transparencyAttr = node.getAttr(read, frame.current(), "READ_TRANSPARENCY");
        var opacityAttr = node.getAttr(read, frame.current(), "OPACITY");

        transparencyAttr.setValue(true);
        opacityAttr.setValue(transparency);

        var alignmentAttr = node.getAttr(read, frame.current(), "ALIGNMENT_RULE");
        alignmentAttr.setValue(alignmentRule);

        var transparencyModeAttr = node.getAttr(read, frame.current(), "applyMatteToColor");
        transparencyModeAttr.setValue(LayeredPSDTransparencyMode);

        node.linkAttr(read, "DRAWING.ELEMENT", uniqueColumnName);

        column.setEntry(uniqueColumnName, 1, 1, "1");

        CELIO.pasteImageFile({ src : filename, dst : { node : read, frame : 1} } );
        for (var j = 1; j <= frame.numberOf(); ++j)
        {
          column.setEntry(uniqueColumnName, 1, j, "1" + ":" + layerInfo[i].layer);
        }
        newNodes[i] = read;
      }
    }
    else  //The PSD layer info could not be read
    {
      return null;
    }
  }
  else
  {
    
    return dropFileInNewElement( root, filename, transparency, alignmentRule);
	System.println("File imported in one layer. Install CELIO plugin to split layers.");
  }

  if ( newNodes.length > 1) //If more than one node is created (more than 1 layer), connects them all to a composite
  {
    return addCompositeAndConnect( root, basename(filename), newNodes );
  }
  else
  {
    return newNodes[0];
  }
}

function pasteSingleTemplate( root, bottomComposite, filename,  flatten, transparency, alignmentRule )
{
  // preprend the library.

  var newNodeToConnect = null;

  if( filename.substr(  -4  ) == ".TPL" )
  {
    newNodeToConnect = dropTemplate( root, filename, transparency, alignmentRule);
	System.println( "è stato importato correttamente com TPL" );
	
  }
  else if( (filename.substr( -4 ) == ".PSD") && (flatten == "layer") )
  {
    newNodeToConnect = dropPSDSplitLayer( root, filename, transparency, alignmentRule);
	System.println( "è stato importato a livelli" );
	
  }
  else
  {
    // assume the file is a bitmap or a 3d files - add a drawing node of the right type
    // This will also handle psd files imported into a single layer (flattened)
    newNodeToConnect = dropFileInNewElement( root, filename, transparency, alignmentRule);
	System.println( "è una jpg importata correttamente, se doveva essere un PSD o un template sentire Edo" );
  }


  // find the default composite and connect 'newNodeToConnect' to this composite.
  if ( newNodeToConnect && bottomComposite )
  {
    var n = node.numberOfInputPorts( bottomComposite);
    node.link( newNodeToConnect, 0, bottomComposite, n );
  }
}

function findBestComposite( root )
{
  var nodes = node.subNodes( root);
  var best = null;
  nodes.forEach( function(n) {
                if( node.type( n ) == "COMPOSITE" )
                {
                  if( best == null )
                    best = n;
                  else if( node.coordY( n ) < node.coordY( best ) )
                  {
                    best = n;
                  }
                }
    });
  return best;
}

function createDefaultNetwork()
{
  const NODE_WIDTH = 130;

  var isCreateNet = true

  var oldNbFrames = frame.numberOf();
  if (oldNbFrames < 60)
    frame.insert(0, 60-oldNbFrames);
  var nbColumns = 1;

  var addedReadNodes = [];
  var xPos = Math.round(-(nbColumns * NODE_WIDTH/2));
  var yPos = -50;
  var compNode;
  var dispNode;
  var writeNode;

  isCreateNet = true;

  if (nbColumns > 0 && isCreateNet == true)
  {
    compNode = node.add(node.root(),"Composite" , "COMPOSITE", 0, yPos+50, 0);
    dispNode = node.add(node.root(),"Display" , "DISPLAY", 50, yPos+100, 0);
    writeNode = node.add(node.root(),"Write", "WRITE", -50, yPos+100, 0);
    node.link(compNode, 0 , dispNode, 0);
    node.link(compNode, 0 , writeNode, 0);
  }

  for (var i=1; i<=nbColumns; i++)
  {
    var elemName;
    if( i==1 )
        elemName = "Drawing";
    else
        elemName = "Drawing_" + (i-1);
      var elemId = element.add(elemName, "BW", scene.numberOfUnitsZ(), "SCAN", "TVG");
    if ( elemId != -1 )
    {
      column.add(elemName, "DRAWING");
      column.setElementIdOfDrawing( elemName, elemId );
    }

    if ( isCreateNet )
    {
      var vnode = node.add(node.root(), elemName, "READ", xPos, yPos, 0);
      addedReadNodes[i-1] = vnode;
      // DRAWING.ELEMENT: same hierarchy as in .solo file
      node.linkAttr(vnode, "DRAWING.ELEMENT", elemName);

      xPos += NODE_WIDTH;
    }
  }

  if ( isCreateNet )
  {
    var compPort = 0;
    for (var i=nbColumns-1; i>=0; i--, compPort++)
    {
      node.link(addedReadNodes[i], 0 , compNode, compPort);
    }

    if (nbColumns >= 1)
    {
      selection.clearSelection();
      selection.addNodeToSelection(addedReadNodes[0]);
      // if node.setAsGlobalDisplay is implemented then use it.
      if (typeof node.setAsGlobalDisplay == "function" )
      {
        node.setAsGlobalDisplay(dispNode);
      }
    }
  }
}

function paste( reference_json_filename )
{
		var currentpath = String(scene.currentProjectPathRemapped())
		var JsonPath = currentpath.replace("\\\\SRV-HARMONY24\\usadata000\\125_BIRTHDAY\\scene-", "") + ".json";
		System.println( "JSON Trovato!" + JsonPath );
	
  if (reference_json_filename == null)

		reference_json_filename = scene.currentProjectPathRemapped() + "\\" + JsonPath ;

  System.println( "Inizio il scene prep nella cartella: " + reference_json_filename );
  
  
  
  var fileContent = readJSON( reference_json_filename );
  if( fileContent == null )
  {
    System.println( "TB_WebCC_Paste.js : file not found :" + reference_json_filename );
    return;
  }
  
  var root = node.root();
  var bottomComposite = findBestComposite( root );

  scene.beginUndoRedoAccum("Paste template from Producer");

  var transparency, flatten, alignmentRule, templates  = null;

  if( node.numberOfSubNodes( root ) == 0 )
  {
    createDefaultNetwork();
  }


  if ('transparency' in fileContent)
  {
    transparency = fileContent.transparency;
  }
  else
  {
    transparency = 100;
  }

  if ('psd' in fileContent)
  {
    flatten = fileContent.psd;
	System.println( "ho trovato questo come opzione per i PSD: " + flatten );
  }
  else
  {
    flatten = "flatten";
	System.println( "Manca l'opzione per importare a livelli, appiattisco" );
  }

  if ('alignment' in fileContent)
  {
    alignmentRule = fileContent.alignment;
  }
  else
  {
    alignmentRule = 4;
  }

  if (alignmentRule == "pan")
  {
    alignmentRule = 10;
  }
  else if (alignmentRule =="project_resolution")
  {
    alignmentRule = 9;
  }
  else
  {
    alignmentRule = 4;
  }

  if ('files' in fileContent)
  {
    templates = fileContent.files;
	System.println( "ho trovato questi file nel JSON: " + templates );
  }
  else
  {
    System.println( "TB_WebCC_Paste.js : file list not found in:" + "\n" + reference_json_filename );
    templates = null;
  }

  if (templates && Array.isArray( templates ) )
  {
    templates.forEach( function( filename ){
      System.println( "...." + filename);
      pasteSingleTemplate( root, bottomComposite, filename,  flatten, transparency, alignmentRule );
    });
  }


  scene.endUndoRedoAccum();
  scene.saveAsNewVersion("Producer Paste", true );

  System.println( "TB_WebCC_Paste.js - done");
}
