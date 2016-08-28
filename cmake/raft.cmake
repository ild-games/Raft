
message("#### Raft CMAKE ####")
include_directories(${RAFT_INCLUDE_DIR})
link_directories(${RAFT_LIB_DIR})

IF(APPLE)
    set (CMAKE_CXX_FLAGS "-F\"${RAFT_FRAMEWORK_DIR}\" ${CMAKE_CXX_FLAGS}")
ENDIF(APPLE)

MACRO(RAFT_INSTALL_HEADERS HEADER_LIST)
    FOREACH( file ${HEADER_LIST} )
        get_filename_component( dir ${file} DIRECTORY )
        install( FILES ${file} DESTINATION include/${dir} )
    ENDFOREACH()
ENDMACRO(RAFT_INSTALL_HEADERS)
