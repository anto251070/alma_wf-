{
	"contents": {
		"81890844-59be-4786-9c1c-81094e1930c6": {
			"classDefinition": "com.sap.bpm.wfs.Model",
			"id": "ch.unige.fi.alma_wf",
			"subject": "Alma Workflow",
			"name": "alma_wf",
			"documentation": "Alma Workflow",
			"lastIds": "62d7f4ed-4063-4c44-af8b-39050bd44926",
			"events": {
				"11a9b5ee-17c0-4159-9bbf-454dcfdcd5c3": {
					"name": "StartEvent1"
				},
				"2798f4e7-bc42-4fad-a248-159095a2f40a": {
					"name": "EndEvent1"
				}
			},
			"activities": {
				"7343394d-b17b-4cee-96d5-887f8ddf4a30": {
					"name": "Post Parked Document"
				}
			},
			"sequenceFlows": {
				"c6b99f32-5fe6-4ab6-b60a-80fba1b9ae0f": {
					"name": "SequenceFlow1"
				},
				"6e507462-ba65-4352-a58d-858421c7e0b9": {
					"name": "SequenceFlow2"
				}
			},
			"diagrams": {
				"42fa7a2d-c526-4a02-b3ba-49b5168ba644": {}
			}
		},
		"11a9b5ee-17c0-4159-9bbf-454dcfdcd5c3": {
			"classDefinition": "com.sap.bpm.wfs.StartEvent",
			"id": "startevent1",
			"name": "StartEvent1"
		},
		"2798f4e7-bc42-4fad-a248-159095a2f40a": {
			"classDefinition": "com.sap.bpm.wfs.EndEvent",
			"id": "endevent1",
			"name": "EndEvent1"
		},
		"7343394d-b17b-4cee-96d5-887f8ddf4a30": {
			"classDefinition": "com.sap.bpm.wfs.UserTask",
			"subject": "Facture ${context.Type} ${context.Belnr}",
			"priority": "MEDIUM",
			"isHiddenInLogForParticipant": false,
			"supportsForward": true,
			"userInterface": "sapui5://alma_mng_approuter.chunigefiuialmamodule/ch.unige.fi.uialmamodule",
			"recipientUsers": "${context.to}",
			"id": "usertask1",
			"name": "Post Parked Document"
		},
		"c6b99f32-5fe6-4ab6-b60a-80fba1b9ae0f": {
			"classDefinition": "com.sap.bpm.wfs.SequenceFlow",
			"id": "sequenceflow1",
			"name": "SequenceFlow1",
			"sourceRef": "11a9b5ee-17c0-4159-9bbf-454dcfdcd5c3",
			"targetRef": "7343394d-b17b-4cee-96d5-887f8ddf4a30"
		},
		"6e507462-ba65-4352-a58d-858421c7e0b9": {
			"classDefinition": "com.sap.bpm.wfs.SequenceFlow",
			"id": "sequenceflow2",
			"name": "SequenceFlow2",
			"sourceRef": "7343394d-b17b-4cee-96d5-887f8ddf4a30",
			"targetRef": "2798f4e7-bc42-4fad-a248-159095a2f40a"
		},
		"42fa7a2d-c526-4a02-b3ba-49b5168ba644": {
			"classDefinition": "com.sap.bpm.wfs.ui.Diagram",
			"symbols": {
				"df898b52-91e1-4778-baad-2ad9a261d30e": {},
				"53e54950-7757-4161-82c9-afa7e86cff2c": {},
				"6bb141da-d485-4317-93b8-e17711df4c32": {},
				"7fd2dc9b-202b-4020-9f63-7a520edacf6b": {},
				"c2ce012c-660a-4873-adf2-3af52de3a4fd": {}
			}
		},
		"df898b52-91e1-4778-baad-2ad9a261d30e": {
			"classDefinition": "com.sap.bpm.wfs.ui.StartEventSymbol",
			"x": 100,
			"y": 100,
			"width": 32,
			"height": 32,
			"object": "11a9b5ee-17c0-4159-9bbf-454dcfdcd5c3"
		},
		"53e54950-7757-4161-82c9-afa7e86cff2c": {
			"classDefinition": "com.sap.bpm.wfs.ui.EndEventSymbol",
			"x": 340,
			"y": 100,
			"width": 35,
			"height": 35,
			"object": "2798f4e7-bc42-4fad-a248-159095a2f40a"
		},
		"6bb141da-d485-4317-93b8-e17711df4c32": {
			"classDefinition": "com.sap.bpm.wfs.ui.SequenceFlowSymbol",
			"points": "116,116 234,116",
			"sourceSymbol": "df898b52-91e1-4778-baad-2ad9a261d30e",
			"targetSymbol": "7fd2dc9b-202b-4020-9f63-7a520edacf6b",
			"object": "c6b99f32-5fe6-4ab6-b60a-80fba1b9ae0f"
		},
		"7fd2dc9b-202b-4020-9f63-7a520edacf6b": {
			"classDefinition": "com.sap.bpm.wfs.ui.UserTaskSymbol",
			"x": 184,
			"y": 86,
			"width": 100,
			"height": 60,
			"object": "7343394d-b17b-4cee-96d5-887f8ddf4a30"
		},
		"c2ce012c-660a-4873-adf2-3af52de3a4fd": {
			"classDefinition": "com.sap.bpm.wfs.ui.SequenceFlowSymbol",
			"points": "234,116.75 357.5,116.75",
			"sourceSymbol": "7fd2dc9b-202b-4020-9f63-7a520edacf6b",
			"targetSymbol": "53e54950-7757-4161-82c9-afa7e86cff2c",
			"object": "6e507462-ba65-4352-a58d-858421c7e0b9"
		},
		"62d7f4ed-4063-4c44-af8b-39050bd44926": {
			"classDefinition": "com.sap.bpm.wfs.LastIDs",
			"sequenceflow": 2,
			"startevent": 1,
			"endevent": 1,
			"usertask": 1
		}
	}
}
