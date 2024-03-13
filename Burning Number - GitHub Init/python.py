import networkx as nx
import json
import numpy as np




def complete_graphs_to_JSON():
    for i in range(1,30):
        G = nx.complete_graph(i)
        vtx_positions_dumb = list(nx.spring_layout(G).values())
        vtx_positions = []
        for pair in vtx_positions_dumb:
            vtx_positions.append((pair[0],pair[1]))

        print(vtx_positions)


        edge_list = list(G.edges(data=False))



        # Format the edge list as JSON - here we choose a simple list of lists representation
        edge_list_json = json.dumps(edge_list, indent=2)
        vtx_positions_json = json.dumps(vtx_positions, indent=2)

        # Define the path for the JSON file
        json_file_path_edge_list = 'graph_edge_list_complete_graph_' + str(i) + '.json'
        json_file_path_vtx_positions = 'vtx_positions_list_complete_graph_' + str(i) + '.json'

        # Write the JSON data to a file
        with open(json_file_path_edge_list, 'w') as json_file:
            json_file.write(edge_list_json)

        with open(json_file_path_vtx_positions, 'w') as json_file:
            json_file.write(vtx_positions_json)
        # Return the path to the saved JSON file
        json_file_path_edge_list
        json_file_path_vtx_positions


def complete_bipartite_graphs_to_JSON():
    for i in range(1,16):
        for j in range(1,16):
            G = nx.complete_bipartite_graph(i,j)
            vtx_positions_dumb = list(nx.spring_layout(G).values())
            vtx_positions = []
            for pair in vtx_positions_dumb:
                vtx_positions.append((pair[0],pair[1]))

            print(vtx_positions)


            edge_list = list(G.edges(data=False))



            # Format the edge list as JSON - here we choose a simple list of lists representation
            edge_list_json = json.dumps(edge_list, indent=2)
            vtx_positions_json = json.dumps(vtx_positions, indent=2)

            # Define the path for the JSON file
            json_file_path_edge_list = 'graph_edge_list_complete_bipartite_graph_' + str(i) + '_' + str(j) + '.json'
            json_file_path_vtx_positions = 'vtx_positions_list_complete_bipartite_graph_' + str(i) + '_' + str(j) + '.json'

            # Write the JSON data to a file
            with open(json_file_path_edge_list, 'w') as json_file:
                json_file.write(edge_list_json)

            with open(json_file_path_vtx_positions, 'w') as json_file:
                json_file.write(vtx_positions_json)
            # Return the path to the saved JSON file
            json_file_path_edge_list
            json_file_path_vtx_positions
complete_graphs_to_JSON()
complete_bipartite_graphs_to_JSON()




