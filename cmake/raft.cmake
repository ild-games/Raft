
message("#### Raft CMAKE ####")
include_directories(${RAFT_INCLUDE_DIR})
link_directories(${RAFT_LIB_DIR})

IF(APPLE)
    set (CMAKE_CXX_FLAGS "-F\"${RAFT_FRAMEWORK_DIR}\" ${CMAKE_CXX_FLAGS}")
ENDIF(APPLE)

IF(MSVC)
    if(CMAKE_CXX_FLAGS MATCHES "/W[0-4]")
      string(REGEX REPLACE "/W[0-4]" "/W0" CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS}")
    else()
      set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /W0")
    endif()
ENDIF(MSVC)

MACRO(RAFT_INSTALL_HEADERS HEADER_LIST)
    FOREACH( file ${HEADER_LIST} )
        get_filename_component( dir ${file} DIRECTORY )
        install( FILES ${file} DESTINATION include/${dir} )
    ENDFOREACH()
ENDMACRO(RAFT_INSTALL_HEADERS)
