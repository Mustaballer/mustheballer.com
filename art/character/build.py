"""
Builds the study's character: a toy-figure Mustafa, rigged and animated, exported as a GLB.

Run headless:
  blender -b -P art/character/build.py -- <out.glb> [preview_dir]

Coordinates are Blender's (Z up). The figure faces +Y, so after glTF export (+Y up) it faces -Z in three.js.
Meshes are rigid parts parented to bones (a jointed action-figure rig), which keeps the toon outlines clean.
Poses are authored with IK targets (hands on the keyboard, feet on the floor) and baked to FK keyframes.
"""

import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
OUT = argv[0] if argv else os.path.join(os.path.dirname(__file__), "mustafa.glb")
PREVIEW_DIR = argv[1] if len(argv) > 1 else None
FPS = 24

# ----------------------------------------------------------------------------- scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = FPS


def color_mat(name, rgb_hex, rough=0.7):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    h = rgb_hex.lstrip("#")
    srgb = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    bsdf.inputs["Base Color"].default_value = (*lin, 1.0)
    bsdf.inputs["Roughness"].default_value = rough
    m.diffuse_color = (*lin, 1.0)  # workbench preview colour
    return m


MAT = {
    "skin": color_mat("Skin", "#a8704b"),
    "hair": color_mat("Hair", "#141016", 0.5),
    "hoodie": color_mat("Hoodie", "#14305f", 0.9),
    "pants": color_mat("Pants", "#2f3446", 0.9),
    "shoe": color_mat("Shoe", "#f2f1ed", 0.6),
    "sole": color_mat("Sole", "#2a2a2e", 0.8),
    "glasses": color_mat("Glasses", "#0b0b10", 0.15),
    "pods": color_mat("AirPods", "#fbfbf9", 0.3),
    "string": color_mat("Drawstring", "#e8e4dc", 0.8),
}

# ----------------------------------------------------------------------------- armature
# name: (head, tail, parent)
BONES = {
    "root": ((0, 0, 0), (0, 0, 0.1), None),
    "hips": ((0, 0, 0.67), (0, 0, 0.79), "root"),
    "spine": ((0, 0, 0.79), (0, 0, 0.9), "hips"),
    "chest": ((0, 0, 0.9), (0, 0, 1.02), "spine"),
    "neck": ((0, 0, 1.02), (0, 0, 1.08), "chest"),
    "head": ((0, 0, 1.08), (0, 0, 1.36), "neck"),
}
A = math.radians(62)  # A-pose: arms angled down
for side, sx in (("L", -1), ("R", 1)):
    sh = Vector((sx * 0.19, 0, 0.995))
    d = Vector((sx * math.cos(A), 0, -math.sin(A)))
    el = sh + d * 0.23
    wr = el + d * 0.21
    BONES[f"upperarm.{side}"] = (tuple(sh), tuple(el), "chest")
    BONES[f"forearm.{side}"] = (tuple(el), tuple(wr), f"upperarm.{side}")
    BONES[f"hand.{side}"] = (tuple(wr), tuple(wr + d * 0.07), f"forearm.{side}")
    BONES[f"thigh.{side}"] = ((sx * 0.095, 0, 0.67), (sx * 0.095, 0, 0.37), "hips")
    BONES[f"shin.{side}"] = ((sx * 0.095, 0, 0.37), (sx * 0.095, 0, 0.075), f"thigh.{side}")
    BONES[f"foot.{side}"] = ((sx * 0.095, 0, 0.075), (sx * 0.095, 0.12, 0.03), f"shin.{side}")

arm_data = bpy.data.armatures.new("Rig")
arm = bpy.data.objects.new("Mustafa", arm_data)
scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode="EDIT")
for name, (h, t, p) in BONES.items():
    eb = arm_data.edit_bones.new(name)
    eb.head, eb.tail = Vector(h), Vector(t)
    if p:
        eb.parent = arm_data.edit_bones[p]
        eb.use_connect = False
# keep the arm/leg chains' roll consistent so IK bends the right way
for name in BONES:
    if name.startswith(("upperarm", "forearm", "hand")):
        arm_data.edit_bones[name].align_roll(Vector((0, -1, 0)))
    if name.startswith(("thigh", "shin")):
        arm_data.edit_bones[name].align_roll(Vector((0, 1, 0)))
bpy.ops.object.mode_set(mode="OBJECT")


# ----------------------------------------------------------------------------- mesh helpers
def _finish(name, bm, mat, bone, smooth=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    me.materials.append(mat)
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    # rigid-parent to the bone without moving the part
    b = arm.data.bones[bone]
    ob.parent = arm
    ob.parent_type = "BONE"
    ob.parent_bone = bone
    tail = arm.matrix_world @ b.matrix_local @ Matrix.Translation((0, b.length, 0))
    ob.matrix_parent_inverse = tail.inverted()
    return ob


def _align(direction):
    """Rotation taking local +Z onto `direction`."""
    return Vector((0, 0, 1)).rotation_difference(Vector(direction).normalized()).to_matrix().to_4x4()


def ellipsoid(name, mat, bone, center, radii, direction=(0, 0, 1), seg=32, rings=18):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1.0)
    m = Matrix.Translation(center) @ _align(direction) @ Matrix.Diagonal((*radii, 1.0))
    bmesh.ops.transform(bm, matrix=m, verts=bm.verts)
    return _finish(name, bm, mat, bone)


def capsule(name, mat, bone, a, b, r):
    """A smooth limb from point a to point b."""
    a, b = Vector(a), Vector(b)
    mid, length = (a + b) / 2, (b - a).length
    return ellipsoid(name, mat, bone, mid, (r, r, length / 2 + r * 0.6), b - a)


def cone(name, mat, bone, base, direction, r, length, seg=8):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=0.0, depth=length)
    m = Matrix.Translation(Vector(base) + Vector(direction).normalized() * length / 2) @ _align(direction)
    bmesh.ops.transform(bm, matrix=m, verts=bm.verts)
    return _finish(name, bm, mat, bone, smooth=False)


def rbox(name, mat, bone, center, size, bevel=0.02, rot=None):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    bmesh.ops.bevel(bm, geom=bm.edges[:] + bm.verts[:], offset=bevel, segments=3, affect="EDGES")
    m = Matrix.Translation(center) @ (rot or Matrix.Identity(4))
    bmesh.ops.transform(bm, matrix=m, verts=bm.verts)
    return _finish(name, bm, mat, bone)


def b_head(n):
    return Vector(BONES[n][0])


def b_tail(n):
    return Vector(BONES[n][1])


# ----------------------------------------------------------------------------- the figure
# torso: shorts, belly, chest (hoodie), hood bunched at the back, drawstrings
ellipsoid("Pelvis", MAT["pants"], "hips", (0, 0, 0.69), (0.16, 0.12, 0.085))
# hoodie body: a tapered, slightly boxy shape from hem to shoulders
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=40, v_segments=20, radius=1.0)
for v in bm.verts:
    z = v.co.z  # -1 .. 1
    widen = 1.0 + 0.12 * (1 - abs(z))  # fuller in the middle
    v.co.x *= 0.19 * widen * (1.0 if z > -0.6 else 0.95)
    v.co.y *= 0.125 * widen
    v.co.z = 0.875 + z * 0.17
    if v.co.z < 0.74:
        v.co.z = 0.74 + (v.co.z - 0.74) * 0.25  # flatten the hem
_finish("Torso", bm, MAT["hoodie"], "spine")
ellipsoid("Hood", MAT["hoodie"], "chest", (0, -0.085, 1.03), (0.13, 0.07, 0.06))
for sx in (-1, 1):
    capsule(f"Drawstring.{sx}", MAT["string"], "chest", (sx * 0.035, 0.125, 1.0), (sx * 0.04, 0.132, 0.93), 0.006)
    # shoulders: round the hoodie into the arms
    ellipsoid(f"Shoulder.{sx}", MAT["hoodie"], "chest", (sx * 0.18, 0, 0.98), (0.072, 0.07, 0.066))

# neck + head (slightly big, toy proportions)
capsule("Neck", MAT["skin"], "neck", (0, 0.005, 1.0), (0, 0.005, 1.1), 0.045)
HEAD_C = Vector((0, 0.01, 1.2))
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=24, radius=1.0)
for v in bm.verts:
    taper = 1.0 - 0.22 * max(0.0, -v.co.z) ** 1.5  # narrower toward the chin
    v.co.x *= 0.142 * taper
    v.co.y *= 0.15 * (1.0 - 0.1 * max(0.0, -v.co.z))
    v.co.z *= 0.17
    v.co += HEAD_C
    if v.co.y > HEAD_C.y and v.co.z < HEAD_C.z - 0.06:
        v.co.y += 0.012 * (HEAD_C.z - 0.06 - v.co.z) / 0.11  # chin forward a touch
_finish("Head", bm, MAT["skin"], "head")
for sx in (-1, 1):
    ellipsoid(f"Ear.{sx}", MAT["skin"], "head", HEAD_C + Vector((sx * 0.14, -0.005, -0.005)), (0.016, 0.03, 0.038))
    # AirPods: bud in the ear, stem pointing down toward the jaw
    ellipsoid(f"Pod.{sx}", MAT["pods"], "head", HEAD_C + Vector((sx * 0.152, 0.01, -0.012)), (0.013, 0.013, 0.013))
    capsule(f"PodStem.{sx}", MAT["pods"], "head", HEAD_C + Vector((sx * 0.153, 0.016, -0.018)),
            HEAD_C + Vector((sx * 0.151, 0.024, -0.05)), 0.005)

# hair: a cap that covers the forehead but stops above the ears, then spikes swept to his left (-X)
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=24, radius=1.0)
bmesh.ops.transform(bm, matrix=Matrix.Translation(HEAD_C + Vector((0, -0.006, 0.012))) @ Matrix.Diagonal((0.152, 0.162, 0.172, 1)), verts=bm.verts)
cut = []
for v in bm.verts:
    p = v.co - HEAD_C
    front = p.y > 0.05
    back = p.y < -0.06
    limit = 0.045 if front else (-0.07 if back else 0.02)  # fringe low at the front, nape low at the back, high over the ears
    if p.z < limit:
        cut.append(v)
bmesh.ops.delete(bm, geom=cut, context="VERTS")
_finish("HairCap", bm, MAT["hair"], "head")

spikes = [
    # (offset from head centre, direction, radius, length): everything leans toward -X (swept to the side)
    ((0.06, 0.09, 0.15), (-1.0, 0.25, 0.3), 0.05, 0.15),
    ((0.0, 0.11, 0.14), (-1.0, 0.3, 0.2), 0.05, 0.15),
    ((-0.06, 0.1, 0.12), (-1.0, 0.25, 0.05), 0.045, 0.13),
    ((0.06, 0.0, 0.17), (-1.0, 0.0, 0.35), 0.055, 0.16),
    ((0.0, 0.0, 0.17), (-1.0, 0.05, 0.25), 0.055, 0.15),
    ((-0.07, 0.01, 0.15), (-1.0, 0.05, 0.05), 0.05, 0.13),
    ((0.05, -0.08, 0.14), (-1.0, -0.35, 0.3), 0.05, 0.14),
    ((-0.04, -0.08, 0.13), (-1.0, -0.35, 0.1), 0.05, 0.13),
    ((0.0, -0.13, 0.07), (-0.6, -0.8, 0.0), 0.045, 0.1),
    ((-0.12, 0.04, 0.07), (-1.0, 0.2, -0.35), 0.04, 0.1),
    ((-0.12, -0.05, 0.07), (-1.0, -0.2, -0.3), 0.04, 0.1),
    ((0.12, 0.02, 0.1), (-0.2, 0.0, 1.0), 0.04, 0.07),
    # fringe swept across the forehead
    ((0.08, 0.14, 0.07), (-1.0, 0.35, -0.25), 0.035, 0.12),
    ((0.02, 0.15, 0.065), (-1.0, 0.3, -0.35), 0.035, 0.11),
    ((-0.05, 0.14, 0.06), (-1.0, 0.25, -0.45), 0.03, 0.09),
]
for i, (o, d, r, l) in enumerate(spikes):
    cone(f"Spike.{i}", MAT["hair"], "head", HEAD_C + Vector(o), d, r, l)

# sunglasses: two lenses angled to wrap the face, a bridge, arms back to the ears
gy = HEAD_C.y + 0.148
for sx in (-1, 1):
    rot = Matrix.Rotation(sx * -0.32, 4, "Z")
    rbox(f"Lens.{sx}", MAT["glasses"], "head", HEAD_C + Vector((sx * 0.057, 0.146, 0.01)), (0.088, 0.014, 0.05), 0.01, rot)
    capsule(f"Temple.{sx}", MAT["glasses"], "head", HEAD_C + Vector((sx * 0.095, 0.12, 0.018)),
            HEAD_C + Vector((sx * 0.143, -0.01, 0.01)), 0.0055)
capsule("Bridge", MAT["glasses"], "head", HEAD_C + Vector((-0.02, 0.152, 0.018)), HEAD_C + Vector((0.02, 0.152, 0.018)), 0.006)

# arms: hoodie sleeves, ball elbows, mitten hands with a thumb
for side, sx in (("L", -1), ("R", 1)):
    ua, fa = f"upperarm.{side}", f"forearm.{side}"
    capsule(f"UpperArm.{side}", MAT["hoodie"], ua, b_head(ua), b_tail(ua), 0.06)
    ellipsoid(f"Elbow.{side}", MAT["hoodie"], fa, b_head(fa), (0.058, 0.058, 0.058))
    capsule(f"Forearm.{side}", MAT["hoodie"], fa, b_head(fa), b_tail(fa) - (b_tail(fa) - b_head(fa)).normalized() * 0.02, 0.055)
    hb = f"hand.{side}"
    d = (b_tail(hb) - b_head(hb)).normalized()
    hc = b_head(hb) + d * 0.04
    ellipsoid(f"Hand.{side}", MAT["skin"], hb, hc, (0.045, 0.034, 0.055), d)
    ellipsoid(f"Thumb.{side}", MAT["skin"], hb, hc + Vector((0, 0.035, 0.0)) - Vector((sx * 0.01, 0, 0)), (0.013, 0.013, 0.025), d + Vector((0, 0.6, 0)))
    # legs
    th, sh, ft = f"thigh.{side}", f"shin.{side}", f"foot.{side}"
    capsule(f"Thigh.{side}", MAT["pants"], th, b_head(th), b_tail(th), 0.08)
    ellipsoid(f"Knee.{side}", MAT["pants"], sh, b_head(sh), (0.07, 0.07, 0.07))
    capsule(f"Shin.{side}", MAT["pants"], sh, b_head(sh), b_tail(sh) + Vector((0, 0, 0.02)), 0.065)
    # white sneaker with a dark sole
    rbox(f"Shoe.{side}", MAT["shoe"], ft, (sx * 0.095, 0.04, 0.045), (0.085, 0.17, 0.07), 0.03)
    rbox(f"Sole.{side}", MAT["sole"], ft, (sx * 0.095, 0.04, 0.012), (0.09, 0.175, 0.02), 0.008)

# ----------------------------------------------------------------------------- IK rig for authoring
def empty(name, loc):
    e = bpy.data.objects.new(name, None)
    e.empty_display_size = 0.04
    e.location = loc
    scene.collection.objects.link(e)
    return e


targets = {}
for side, sx in (("L", -1), ("R", 1)):
    targets[f"hand.{side}"] = empty(f"IK_hand.{side}", (sx * 0.17, 0.42, 0.9))
    targets[f"elbow.{side}"] = empty(f"Pole_elbow.{side}", (sx * 0.6, -0.4, 0.8))

bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode="POSE")
for side in ("L", "R"):
    c = arm.pose.bones[f"forearm.{side}"].constraints.new("IK")
    c.target = targets[f"hand.{side}"]
    c.pole_target = targets[f"elbow.{side}"]
    c.pole_angle = math.radians(-90)
    c.chain_count = 2
for pb in arm.pose.bones:
    pb.rotation_mode = "XYZ"
bpy.ops.object.mode_set(mode="OBJECT")

# ----------------------------------------------------------------------------- clips
# Placed in the room at scale 1.12 with a -0.23 offset, the floor is at Z≈0.205 and the keyboard at Z≈0.9, Y≈0.42.
SEATED_FEET = {"L": (-0.11, 0.33, 0.29), "R": (0.11, 0.33, 0.29)}
KEYS_Z = 0.9


def key_target(name, frame, loc):
    o = targets[name]
    o.location = loc
    o.keyframe_insert("location", frame=frame)


def key_rot(bone, frame, x=0.0, y=0.0, z=0.0):
    pb = arm.pose.bones[bone]
    pb.rotation_euler = (x, y, z)
    pb.keyframe_insert("rotation_euler", frame=frame)


def reset_clip():
    for o in targets.values():
        o.animation_data_clear()
    arm.animation_data_clear()
    for pb in arm.pose.bones:
        pb.rotation_euler = (0, 0, 0)
        pb.location = (0, 0, 0)


def aim(bone, direction, frame):
    """Rotate a pose bone so it points along `direction` (armature space), then key it."""
    bpy.context.view_layer.update()
    pb = arm.pose.bones[bone]
    y = Vector(direction).normalized()
    x_ref = pb.matrix.to_3x3().col[0]
    z = x_ref.cross(y).normalized()
    x = y.cross(z).normalized()
    m = Matrix((x, y, z)).transposed().to_4x4()
    m.translation = pb.matrix.translation
    pb.matrix = m
    bpy.context.view_layer.update()
    pb.keyframe_insert("rotation_euler", frame=frame)


def seated_base(frames):
    """Thighs forward on the seat, shins down to the floor, elbows out; held over the clip."""
    for f in frames:
        scene.frame_set(f)
        for side, sx in (("L", -1), ("R", 1)):
            aim(f"thigh.{side}", (sx * 0.08, 1.0, -0.02), f)
            aim(f"shin.{side}", (sx * 0.02, 0.18, -1.0), f)
            aim(f"foot.{side}", (0, 1.0, -0.25), f)
            key_target(f"elbow.{side}", f, (sx * 0.6, -0.4, 0.8))


def clip_type():
    end = 48
    seated_base((1, end))
    keys = [(1, 0, 0), (7, 1, 0), (13, 0, 1), (19, 1, 1), (25, 0, 0), (31, 1, 0), (37, 0, 1), (43, 1, 0), (48, 0, 0)]
    for f, l_up, r_up in keys:
        key_target("hand.L", f, (-0.17 + 0.01 * r_up, 0.42, KEYS_Z + 0.014 * l_up))
        key_target("hand.R", f, (0.17 - 0.01 * l_up, 0.42 + 0.01 * r_up, KEYS_Z + 0.014 * r_up))
    for f, nod in ((1, 0.0), (24, 0.05), (48, 0.0)):
        key_rot("spine", f, x=-0.12)
        key_rot("chest", f, x=-0.06)
        key_rot("head", f, x=nod + 0.04)
    return end


def clip_idle():
    end = 72
    seated_base((1, end))
    for f, breathe in ((1, 0.0), (36, 1.0), (72, 0.0)):
        key_target("hand.L", f, (-0.13, 0.24, 0.775 + 0.005 * breathe))
        key_target("hand.R", f, (0.13, 0.24, 0.775 + 0.005 * breathe))
        key_rot("spine", f, x=0.02 + 0.02 * breathe)
        key_rot("chest", f, x=0.0)
        key_rot("head", f, x=-0.05, z=0.06 * (breathe - 0.5))
    return end


def clip_wave():
    end = 48
    seated_base((1, end))
    key_target("hand.L", 1, (-0.13, 0.24, 0.775))
    key_target("hand.L", end, (-0.13, 0.24, 0.775))
    key_target("hand.R", 1, (0.13, 0.24, 0.775))
    for i, f in enumerate((8, 14, 20, 26, 32, 38)):
        key_target("hand.R", f, (0.28 + (0.06 if i % 2 else -0.03), 0.1, 1.3))
    key_target("hand.R", end, (0.13, 0.24, 0.775))
    for f in (1, end):
        key_target("elbow.R", f, (0.6, -0.4, 0.8))
    for f, tilt in ((1, 0.0), (14, 0.12), (38, 0.12), (48, 0.0)):
        key_rot("head", f, z=-tilt * 0.6, y=tilt)
        key_rot("spine", f, x=0.02)
    return end


def clip_stretch():
    end = 60
    seated_base((1, end))
    for side, sx in (("L", -1), ("R", 1)):
        key_target(f"hand.{side}", 1, (sx * 0.13, 0.24, 0.775))
        key_target(f"hand.{side}", 18, (sx * 0.12, 0.0, 1.58))
        key_target(f"hand.{side}", 40, (sx * 0.14, -0.02, 1.6))
        key_target(f"hand.{side}", end, (sx * 0.13, 0.24, 0.775))
    for f, lean in ((1, 0.0), (18, 1.0), (40, 1.0), (60, 0.0)):
        key_rot("spine", f, x=0.12 * lean)
        key_rot("chest", f, x=0.1 * lean)
        key_rot("head", f, x=0.18 * lean)
    return end


def bake(name, end):
    scene.frame_start, scene.frame_end = 1, end
    bpy.context.view_layer.objects.active = arm
    arm.select_set(True)
    bpy.ops.object.mode_set(mode="POSE")
    bpy.ops.pose.select_all(action="SELECT")
    bpy.ops.nla.bake(frame_start=1, frame_end=end, only_selected=False, visual_keying=True,
                     clear_constraints=False, use_current_action=False, bake_types={"POSE"})
    bpy.ops.object.mode_set(mode="OBJECT")
    act = arm.animation_data.action
    act.name = name
    act.use_fake_user = True
    return act


CLIPS = {"Type": clip_type, "Idle": clip_idle, "Wave": clip_wave, "Stretch": clip_stretch}
baked = {}
for name, fn in CLIPS.items():
    reset_clip()
    end = fn()
    baked[name] = (bake(name, end), end)

# ----------------------------------------------------------------------------- previews
if PREVIEW_DIR:
    os.makedirs(PREVIEW_DIR, exist_ok=True)
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.color_type = "MATERIAL"
    scene.display.shading.light = "STUDIO"
    scene.display.shading.show_object_outline = True
    scene.render.resolution_x = scene.render.resolution_y = 520
    cam = bpy.data.objects.new("Cam", bpy.data.cameras.new("Cam"))
    scene.collection.objects.link(cam)
    scene.camera = cam
    cam.data.lens = 50
    for e in targets.values():
        e.hide_render = True
    # reference props for judging the seated pose: floor, seat and keyboard as they'll be placed in the room
    props = []
    for nm, loc, size in (("RefFloor", (0, 0.2, 0.2), (1.4, 1.4, 0.01)), ("RefSeat", (0, 0.05, 0.585), (0.42, 0.42, 0.04)),
                          ("RefDesk", (0, 0.55, 0.87), (1.0, 0.45, 0.03))):
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
        o = bpy.context.active_object
        o.name = nm
        o.scale = size
        props.append(o)

    def look(pos, at):
        cam.location = pos
        cam.rotation_euler = (Vector(at) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()

    # rest pose
    for c in [c for pb in arm.pose.bones for c in pb.constraints]:
        c.mute = True
    arm.animation_data.action = None
    for pb in arm.pose.bones:
        pb.rotation_euler = (0, 0, 0)
    look((1.4, 2.0, 1.2), (0, 0, 0.75))
    scene.frame_set(1)
    scene.render.filepath = os.path.join(PREVIEW_DIR, "rest.png")
    bpy.ops.render.render(write_still=True)
    look((0.45, 0.42, 1.28), (0, 0.01, 1.2))
    scene.render.filepath = os.path.join(PREVIEW_DIR, "face.png")
    bpy.ops.render.render(write_still=True)
    for name, (act, end) in baked.items():
        arm.animation_data.action = act
        scene.frame_set(end // 3)
        look((1.6, 1.4, 1.25), (0, 0.15, 0.8))
        scene.render.filepath = os.path.join(PREVIEW_DIR, f"{name}.png")
        bpy.ops.render.render(write_still=True)
    arm.animation_data.action = baked["Type"][0]
    scene.frame_set(10)
    look((1.9, 0.25, 0.85), (0, 0.25, 0.75))
    scene.render.filepath = os.path.join(PREVIEW_DIR, "side.png")
    bpy.ops.render.render(write_still=True)
    for o in props:
        bpy.data.objects.remove(o, do_unlink=True)

# ----------------------------------------------------------------------------- export
for pb in arm.pose.bones:
    for c in list(pb.constraints):
        pb.constraints.remove(c)
for e in list(targets.values()):
    bpy.data.objects.remove(e, do_unlink=True)
arm.animation_data.action = baked["Type"][0]
for pb in arm.pose.bones:
    pb.rotation_euler = (0, 0, 0)
    pb.location = (0, 0, 0)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    use_selection=False,
    export_animations=True,
    export_animation_mode="ACTIONS",
    export_force_sampling=True,
    export_frame_range=False,
    export_apply=False,
    export_yup=True,
)
print("EXPORTED", OUT)
